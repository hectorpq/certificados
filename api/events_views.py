"""
Event and Invitation Views - Complete API endpoints
"""
from rest_framework import viewsets, status, permissions, serializers
from rest_framework.decorators import action, api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.core.mail import EmailMessage
from django.conf import settings
from smtplib import SMTPException
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import pandas as pd
import json
import zipfile
import io
import tempfile
from pathlib import Path
import logging
import uuid

from events.models import Event, Invitation, Enrollment
from students.models import Student
from users.models import User
from certificados.models import Certificate
from .serializers import (
    EventListSerializer,
    EventDetailSerializer,
    EventCreateSerializer,
    EventTemplateSerializer,
    InvitationListSerializer,
    InvitationCreateSerializer,
    InvitationPublicSerializer,
    AcceptInvitationSerializer,
)

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────
# PERMISSION CLASSES
# ─────────────────────────────────────────

class IsEventOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.created_by == request.user or request.user.is_staff


# ─────────────────────────────────────────
# EVENT VIEW SET
# ─────────────────────────────────────────

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return EventCreateSerializer
        elif self.action == 'list':
            return EventListSerializer
        elif self.action == 'update_template':
            return EventTemplateSerializer
        return EventDetailSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [AllowAny]  # Público con límite de 30
        elif self.action in ['invitations', 'create_invitations', 'send_invitations', 'resend_invitations', 'clear_invitations', 'update_template', 'generar_certificados', 'enviar_certificados_template']:
            self.permission_classes = [AllowAny]  # Permite acceso público
        else:
            self.permission_classes = [AllowAny]
        return super().get_permissions()
    
    def get_queryset(self):
        user = self.request.user
        # Todas las acciones devuelven todos los eventos activos
        return Event.objects.select_related('created_by', 'category')
    
    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(created_by=self.request.user)
        else:
            serializer.save()
    
    def perform_destroy(self, instance):
        user = self.request.user
        if not user.is_authenticated:
            raise PermissionError("Debes iniciar sesión para eliminar")
        if instance.created_by and instance.created_by != user and not user.is_staff:
            raise PermissionError("Solo el creador puede eliminar este evento")
        instance.delete()
    
    # ── Invitation endpoints ──
    
    @action(detail=True, methods=['get'])
    def invitations(self, request, pk=None):
        """List all invitations for an event"""
        event = self.get_object()
        invitations = event.invitations.all().order_by('-created_at')
        
        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            invitations = invitations.filter(status=status_filter)
        
        serializer = InvitationListSerializer(invitations, many=True)
        return Response({
            'invitations': serializer.data,
            'stats': {
                'total': event.invitations.count(),
                'pending': event.invitations.filter(status__in=['pending', 'sent']).count(),
                'accepted': event.invitations.filter(status='accepted').count(),
                'declined': event.invitations.filter(status='declined').count(),
                'expired': event.invitations.filter(status='expired').count(),
            }
        })
    
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def create_invitations(self, request, pk=None):
        """Create invitations from Excel file"""
        event = self.get_object()
        file = request.FILES.get('file')
        
        if not file:
            return Response({'error': 'Archivo requerido'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Read Excel/CSV
            if file.name.endswith('.csv'):
                df = pd.read_csv(file)
            else:
                df = pd.read_excel(file)
            
            df.columns = df.columns.str.lower().str.strip()
            
            # Normalize columns
            col_rename = {}
            for col in df.columns:
                if 'nombre' in col.lower() and 'email' not in col:
                    col_rename[col] = 'nombre'
                elif 'apellido' in col.lower():
                    col_rename[col] = 'apellido'
                elif 'email' in col.lower() or 'correo' in col.lower():
                    col_rename[col] = 'email'
                elif 'telefono' in col.lower() or 'phone' in col.lower() or 'celular' in col.lower():
                    col_rename[col] = 'telefono'
            
            df.rename(columns=col_rename, inplace=True)
            
            # Validate columns
            if 'nombre' not in df.columns or 'email' not in df.columns:
                return Response({
                    'error': f'Columnas requeridas: nombre, email. Encontradas: {list(df.columns)}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            created = 0
            skipped = 0
            errors = []
            
            for idx, row in df.iterrows():
                try:
                    email = str(row.get('email', '')).strip().lower()
                    nombre = str(row.get('nombre', '')).strip()
                    telefono = str(row.get('telefono', '')).strip()
                    
                    if not email or '@' not in email:
                        errors.append(f"Fila {idx + 2}: Email inválido")
                        skipped += 1
                        continue
                    
                    # Create or get invitation
                    invitation, created_inv = Invitation.objects.get_or_create(
                        event=event,
                        student_email=email,
                        defaults={
                            'student_name': nombre,
                            'phone': telefono if telefono != 'nan' else '',
                        }
                    )
                    
                    if created_inv:
                        created += 1
                    else:
                        skipped += 1
                        
                except Exception as e:
                    errors.append(f"Fila {idx + 2}: {str(e)}")
                    skipped += 1
            
            return Response({
                'success': True,
                'created': created,
                'skipped': skipped,
                'errors': errors[:10]
            })
            
        except Exception as e:
            logger.error(f"Error creating invitations: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def send_invitations(self, request, pk=None):
        """Send invitations via email and WhatsApp"""
        event = self.get_object()
        invitation_ids = request.data.get('invitation_ids', [])
        send_via = request.data.get('via', 'both')
        
        if invitation_ids:
            invitations = event.invitations.filter(id__in=invitation_ids)
        else:
            invitations = event.invitations.filter(status__in=['pending', 'sent'])
        
        if not invitations.exists():
            return Response({
                'success': True,
                'sent_email': 0,
                'sent_whatsapp': 0,
                'message': 'No hay invitaciones para enviar'
            })
        
        user = request.user
        user_email = user.email if user.is_authenticated else None
        user_app_password = user.email_app_password if user.is_authenticated else None
        
        if send_via in ['email', 'both']:
            if not user.is_authenticated:
                return Response({
                    'success': False,
                    'error': 'Debes iniciar sesión para enviar invitaciones por email'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            if not user_app_password:
                return Response({
                    'success': False,
                    'error': 'No tienes App Password configurado. Ve a tu perfil para configurarlo.'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        sent_email = 0
        sent_whatsapp = 0
        errors = []
        
        for invitation in invitations:
            try:
                if send_via in ['email', 'both']:
                    try:
                        self._send_invitation_email(invitation, user_email, user_app_password)
                        sent_email += 1
                    except Exception as email_error:
                        errors.append(f"{invitation.student_email}: {str(email_error)}")
                
                if send_via in ['whatsapp', 'both'] and invitation.phone:
                    try:
                        self._send_invitation_whatsapp(invitation)
                        sent_whatsapp += 1
                    except Exception as wa_error:
                        errors.append(f"{invitation.student_email}: Error de WhatsApp - {str(wa_error)}")
                
                if send_via == 'both':
                    invitation.mark_as_sent('both')
                elif send_via == 'email':
                    invitation.mark_as_sent('email')
                else:
                    invitation.mark_as_sent('whatsapp')
                    
            except Exception as e:
                errors.append(f"{invitation.student_email}: {str(e)}")
        
        if sent_email == 0 and sent_whatsapp == 0 and errors:
            message = errors[0]
        else:
            message = f'{sent_email} email(s) y {sent_whatsapp} WhatsApp(s) enviados'
        
        return Response({
            'success': sent_email > 0 or sent_whatsapp > 0,
            'sent_email': sent_email,
            'sent_whatsapp': sent_whatsapp,
            'message': message,
            'errors': errors[:10]
        })
    
    @action(detail=True, methods=['post'])
    def resend_invitations(self, request, pk=None):
        """Resend invitations to pending/expired"""
        event = self.get_object()
        
        invitations = event.invitations.filter(
            Q(status='pending') | 
            Q(status='sent') | 
            Q(status='expired')
        )
        
        # Refresh expiry for expired invitations
        for invitation in invitations.filter(status='expired'):
            invitation.refresh_expiry()
        
        # Mark as pending again
        invitations.update(status='pending')
        
        # Send all
        return self.send_invitations(request, pk)
    
    @action(detail=True, methods=['post'])
    def clear_invitations(self, request, pk=None):
        """Delete all pending invitations (not accepted)"""
        event = self.get_object()
        
        # Solo eliminar invitaciones pending, sent o expired (no aceptadas)
        deleted_count = event.invitations.exclude(status='accepted').delete()[0]
        
        return Response({
            'success': True,
            'deleted': deleted_count,
            'message': f'{deleted_count} invitación(es) eliminada(s)'
        })
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish event (change status to active)"""
        event = self.get_object()
        event.status = 'active'
        event.save(update_fields=['status'])
        return Response({'success': True, 'status': event.status})
    
    @action(detail=True, methods=['post', 'patch'])
    @parser_classes([MultiPartParser, FormParser])
    def update_template(self, request, pk=None):
        """Update event template settings"""
        event = self.get_object()
        serializer = EventTemplateSerializer(event, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Plantilla guardada para evento {event.id}: {event.template_image}")
            return Response({
                'success': True,
                'template_image_url': event.template_image.url if event.template_image else None,
                'name_x': event.name_x,
                'name_y': event.name_y,
                'name_font_size': event.name_font_size,
            })
        
        logger.error(f"Error en serializer: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    @parser_classes([MultiPartParser, FormParser])
    def generar_certificados(self, request, pk=None):
        """Generate certificates from Excel file using event template"""
        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile
        from reportlab.lib.utils import ImageReader
        import io
        import zipfile
        
        event = self.get_object()
        excel_file = request.FILES.get('file')
        
        if not excel_file:
            return Response({'error': 'Se requiere archivo Excel'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not event.template_image:
            return Response({'error': 'Primero sube una imagen de plantilla'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            df = pd.read_excel(excel_file)
            df.columns = df.columns.str.lower().str.strip()
        except Exception as e:
            return Response({'error': f'Error al leer Excel: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        
        required_cols = ['nombre', 'email']
        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            return Response({
                'error': f'Faltan columnas: {", ".join(missing)}',
                'required': 'nombre, email'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        created = 0
        skipped = 0
        errors = []
        
        for idx, row in df.iterrows():
            try:
                email = str(row.get('email', '')).strip().lower()
                nombre = str(row.get('nombre', '')).strip()
                
                if not email or '@' not in email:
                    errors.append(f"Fila {idx + 2}: Email inválido")
                    skipped += 1
                    continue
                
                student, _ = Student.objects.get_or_create(
                    email=email,
                    defaults={
                        'first_name': nombre.split()[0] if nombre else 'Estudiante',
                        'last_name': ' '.join(nombre.split()[1:]) if nombre else '',
                        'document_id': email.split('@')[0],
                        'phone': str(row.get('telefono', '')).strip(),
                    }
                )
                
                cert, cert_created = Certificate.objects.get_or_create(
                    student=student,
                    event=event,
                    defaults={'status': 'pending'}
                )
                
                if cert_created:
                    created += 1
                else:
                    skipped += 1
                    
            except Exception as e:
                errors.append(f"Fila {idx + 2}: {str(e)}")
                skipped += 1
        
        return Response({
            'success': True,
            'created': created,
            'skipped': skipped,
            'errors': errors[:10]
        })
    
    @action(detail=True, methods=['post'])
    def enviar_certificados_template(self, request, pk=None):
        """Send certificates to students using event template"""
        from smtplib import SMTPException
        from django.core.mail import EmailMessage
        from django.core.mail.backends.smtp import EmailBackend
        
        event = self.get_object()
        via = request.data.get('via', 'email')
        
        user = request.user if request.user.is_authenticated else None
        user_email = user.email if user and user.is_authenticated else None
        user_app_password = user.email_app_password if user and user.is_authenticated else None
        
        if not user_app_password:
            return Response({
                'error': 'No tienes App Password configurado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        certs = Certificate.objects.filter(event=event, status='generated').select_related('student')
        
        if not certs.exists():
            return Response({
                'error': 'No hay certificados generados para enviar'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        sent_email = 0
        sent_whatsapp = 0
        errors = []
        
        for cert in certs:
            try:
                if via in ['email', 'both']:
                    try:
                        connection = EmailBackend(
                            host='smtp.gmail.com',
                            port=587,
                            username=user_email,
                            password=user_app_password,
                            use_tls=True,
                            fail_silently=False
                        )
                        
                        subject = f"🎓 Certificado: {event.name}"
                        message = f"""
¡Felicidades, {cert.student.first_name}!

Tu certificado del evento está listo.

📌 {event.name}
📅 {event.event_date.strftime('%d de %B de %Y')}

--
CertifyPro
                        """.strip()
                        
                        email = EmailMessage(
                            subject=subject,
                            body=message,
                            from_email=user_email,
                            to=[cert.student.email],
                            connection=connection
                        )
                        email.send(fail_silently=False)
                        connection.close()
                        sent_email += 1
                        
                    except SMTPException as e:
                        errors.append(f'{cert.student.email}: {str(e)}')
                
                if via in ['whatsapp', 'both'] and cert.student.phone:
                    try:
                        from services.whatsapp_service import get_whatsapp_service
                        whatsapp = get_whatsapp_service()
                        wa_msg = f"🎓 *Tu certificado está listo*\n\n📌 {event.name}\n\nDescarga tu certificado desde el email que recibiste."
                        whatsapp.send_message(cert.student.phone, wa_msg)
                        sent_whatsapp += 1
                    except Exception as e:
                        errors.append(f'{cert.student.phone}: {str(e)}')
                        
            except Exception as e:
                errors.append(f'{cert.student.email}: {str(e)}')
        
        return Response({
            'success': sent_email > 0 or sent_whatsapp > 0,
            'sent_email': sent_email,
            'sent_whatsapp': sent_whatsapp,
            'message': f'{sent_email} email(s), {sent_whatsapp} WhatsApp(s)',
            'errors': errors[:10]
        })
    
    def _send_invitation_email(self, invitation, user_email, user_app_password):
        """Send invitation email using user's SMTP credentials"""
        from django.core.mail.backends.smtp import EmailBackend
        from smtplib import SMTPException
        
        subject = f"🎓 Invitación: {invitation.event.name}"
        
        message = f"""
Hola {invitation.student_name},

Has sido invitado a participar en:

📌 {invitation.event.name}
📅 {invitation.event.event_date.strftime('%d de %B de %Y')}
📍 {invitation.event.location or 'Por confirmar'}
👨‍🏫 {invitation.event.instructor_name or 'A confirmar'}

{invitation.event.invitation_message or 'Te esperamos en este evento especial.'}

👉 Acepta tu invitación aquí:
{invitation.invitation_url}

¡Te esperamos!

--
Sistema de Certificados
        """.strip()
        
        try:
            connection = EmailBackend(
                host='smtp.gmail.com',
                port=587,
                username=user_email,
                password=user_app_password,
                use_tls=True,
                fail_silently=False
            )
            
            email = EmailMessage(
                subject=subject,
                body=message,
                from_email=user_email,
                to=[invitation.student_email],
                connection=connection
            )
            email.send(fail_silently=False)
            connection.close()
            logger.info(f"Email enviado a {invitation.student_email} desde {user_email}")
        except SMTPException as e:
            logger.error(f"Error SMTP enviando email a {invitation.student_email}: {str(e)}")
            error_msg = str(e)
            if 'authentication' in error_msg.lower() or 'credentials' in error_msg.lower():
                raise Exception("App Password incorrecto. Verifica tu contraseña en Mi Perfil.")
            elif 'connection' in error_msg.lower() or 'timeout' in error_msg.lower():
                raise Exception("Error de conexión. Verifica tu conexión a internet.")
            else:
                raise Exception(f"Error al enviar email: {error_msg}")
    
    def _send_invitation_whatsapp(self, invitation):
        """Send invitation via WhatsApp"""
        from services.whatsapp_service import get_whatsapp_service
        
        whatsapp = get_whatsapp_service()
        
        message = f"""
🎓 *Invitación: {invitation.event.name}*

📅 {invitation.event.event_date.strftime('%d/%m/%Y')}
📍 {invitation.event.location or 'Por confirmar'}

👉 Acepta aquí:
{invitation.invitation_url}

¡Te esperamos!
        """.strip()
        
        result = whatsapp.send_message(invitation.phone, message)
        return result


# ─────────────────────────────────────────
# PUBLIC INVITATION VIEWS
# ─────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def public_invitation(request, token):
    """Get invitation details for public view"""
    try:
        invitation = Invitation.objects.select_related('event').get(token=token)
        
        if invitation.is_expired() and invitation.status not in ['accepted', 'declined']:
            invitation.status = 'expired'
            invitation.save(update_fields=['status'])
        
        serializer = InvitationPublicSerializer(invitation)
        return Response(serializer.data)
        
    except Invitation.DoesNotExist:
        return Response(
            {'error': 'Invitación no encontrada'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def accept_invitation(request, token):
    """Accept an invitation"""
    try:
        invitation = Invitation.objects.select_related('event').get(token=token)
        
        # Check if already accepted
        if invitation.status == 'accepted':
            return Response(
                {'error': 'Esta invitación ya fue aceptada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if expired
        if invitation.is_expired():
            return Response(
                {'error': 'Esta invitación ha expirado'},
                status=status.HTTP_410_GONE
            )
        
        # Get or validate user
        user = None
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        
        # Update invitation name if provided
        if first_name or last_name:
            full_name = f"{first_name} {last_name}".strip()
            if full_name:
                invitation.student_name = full_name
        
        # Try to link user by email
        try:
            user = User.objects.get(email=invitation.student_email)
            invitation.user = user
        except User.DoesNotExist:
            pass
        
        # Create or get student
        student, _ = Student.objects.get_or_create(
            email=invitation.student_email,
            defaults={
                'first_name': first_name or invitation.student_name.split()[0] if invitation.student_name else 'Estudiante',
                'last_name': last_name or ' '.join(invitation.student_name.split()[1:]) if invitation.student_name else '',
                'document_id': invitation.student_email.split('@')[0],
                'phone': invitation.phone,
                'user': user,
            }
        )
        
        # Update student name if different
        if student.first_name != invitation.student_name:
            student.first_name = first_name or invitation.student_name.split()[0] if invitation.student_name else student.first_name
            student.last_name = last_name or ' '.join(invitation.student_name.split()[1:]) if invitation.student_name else student.last_name
            student.save(update_fields=['first_name', 'last_name'])
        
        # Create enrollment
        enrollment, created = Enrollment.objects.get_or_create(
            student=student,
            event=invitation.event,
            defaults={
                'invitation': invitation,
                'attendance': True,
                'status': 'confirmed',
            }
        )
        
        # Create certificate for this student
        certificate, cert_created = Certificate.objects.get_or_create(
            student=student,
            event=invitation.event,
            defaults={
                'status': 'pending',
            }
        )
        
        # Mark invitation as accepted
        invitation.mark_as_accepted(user)
        
        return Response({
            'success': True,
            'message': 'Invitación aceptada correctamente',
            'enrollment': {
                'id': enrollment.id,
                'event_name': invitation.event.name,
                'event_date': invitation.event.event_date,
            },
            'certificate': {
                'id': certificate.id,
                'status': certificate.status,
                'created': cert_created,
            }
        })
        
    except Invitation.DoesNotExist:
        return Response(
            {'error': 'Invitación no encontrada'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error accepting invitation: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def decline_invitation(request, token):
    """Decline an invitation"""
    try:
        invitation = Invitation.objects.get(token=token)
        
        if invitation.status == 'accepted':
            return Response(
                {'error': 'No puedes rechazar una invitación ya aceptada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        invitation.mark_as_declined()
        
        return Response({
            'success': True,
            'message': 'Invitación rechazada'
        })
        
    except Invitation.DoesNotExist:
        return Response(
            {'error': 'Invitación no encontrada'},
            status=status.HTTP_404_NOT_FOUND
        )
