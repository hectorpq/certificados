"""
Certificate Generation Views - 4 methods: Visual, Excel, Manual, Template
"""
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from django.core.mail import EmailMessage
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from django.http import FileResponse, HttpResponse
from django.utils import timezone
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

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────
# PDF GENERATION HELPERS
# ─────────────────────────────────────────

def create_pdf_from_template(template_path, data, positions, output_path):
    """
    Create PDF using template image and position data.
    
    Args:
        template_path: Path to template image
        data: dict with name, event_name, event_date, instructor_name
        positions: dict with x, y, font_size, font_color
        output_path: Path to save PDF
    """
    img = Image.open(template_path)
    img_width, img_height = img.size
    
    c = canvas.Canvas(output_path, pagesize=(img_width, img_height))
    
    # Draw background
    c.drawImage(
        ImageReader(template_path),
        0, 0,
        width=img_width,
        height=img_height
    )
    
    # Configure text
    font_size = positions.get('font_size', 32)
    font_color = positions.get('font_color', '#000000')
    
    if font_color.startswith('#'):
        hex_color = font_color.lstrip('#')
        r, g, b = (int(hex_color[i:i+2], 16) / 255.0 for i in (0, 2, 4))
        c.setFillColorRGB(r, g, b)
    else:
        c.setFillColor(font_color)
    
    c.setFont("Helvetica-Bold", font_size)
    
    # Position
    x = positions.get('x', img_width / 4)
    y = positions.get('y', img_height / 2)
    
    # Split name for two lines if needed
    name = data.get('name', '')
    palabras = name.split()
    
    if len(palabras) >= 2:
        c.drawString(x, y + (font_size * 0.8), palabras[0])
        c.drawString(x, y, ' '.join(palabras[1:]))
    else:
        c.drawString(x, y, name)
    
    c.save()
    return True


def create_default_pdf(data, output_path):
    """
    Create PDF with default design (no template).
    
    Args:
        data: dict with name, event_name, event_date, instructor_name
        output_path: Path to save PDF
    """
    from reportlab.lib.pagesizes import landscape, A4
    from reportlab.lib.units import inch
    from reportlab.lib.colors import HexColor
    
    color_primary = HexColor('#1e3a8a')
    color_secondary = HexColor('#94a3b8')
    
    width, height = landscape(A4)
    
    c = canvas.Canvas(output_path, pagesize=landscape(A4))
    
    # Background
    c.setFillColor(HexColor('#f8fafc'))
    c.rect(0, 0, width, height, fill=True, stroke=False)
    
    # Border
    c.setLineWidth(3)
    c.setStrokeColor(color_primary)
    c.rect(0.3 * inch, 0.3 * inch, width - 0.6 * inch, height - 0.6 * inch)
    
    # Title
    c.setFont("Helvetica-Bold", 48)
    c.setFillColor(color_primary)
    c.drawCentredString(width / 2, height - 1.5 * inch, "CERTIFICADO")
    
    c.setFont("Helvetica", 24)
    c.setFillColor(color_secondary)
    c.drawCentredString(width / 2, height - 2.2 * inch, "DE ASISTENCIA Y PARTICIPACIÓN")
    
    # Name
    c.setFont("Helvetica-Bold", 28)
    c.setFillColor(color_primary)
    name = data.get('name', '').upper()
    c.drawCentredString(width / 2, height - 3.2 * inch, name)
    
    # Event
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(color_primary)
    c.drawCentredString(width / 2, height - 4 * inch, data.get('event_name', '').upper())
    
    # Date
    c.setFont("Helvetica", 14)
    c.setFillColor(color_secondary)
    event_date = data.get('event_date', '')
    if hasattr(event_date, 'strftime'):
        event_date = event_date.strftime('%d de %B de %Y')
    c.drawCentredString(width / 2, height - 4.5 * inch, event_date)
    
    # Instructor
    instructor = data.get('instructor_name', '')
    if instructor:
        c.setFont("Helvetica", 12)
        c.setFillColor(color_secondary)
        c.drawCentredString(width / 2, height - 5 * inch, f"Expositor: {instructor}")
    
    # Footer
    c.setFont("Helvetica", 8)
    c.setFillColor(HexColor('#cbd5e1'))
    c.drawCentredString(width / 2, 0.5 * inch, "Sistema de Certificados")
    
    c.save()
    return True


# ─────────────────────────────────────────
# PERMISSION: ADMIN MODE REQUIRED
# ─────────────────────────────────────────

def require_admin_mode(view_func):
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Autenticación requerida'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        if not request.user.is_admin_mode:
            return Response(
                {'error': 'Modo administrador requerido'},
                status=status.HTTP_403_FORBIDDEN
            )
        return view_func(request, *args, **kwargs)
    return wrapper


# ─────────────────────────────────────────
# GENERATE FROM EXCEL (METHOD 2)
# ─────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
@require_admin_mode
def generate_from_excel(request):
    """
    Generate certificates from Excel file.
    POST /api/generate/excel/
    
    Body (multipart/form-data):
        - event_id: int
        - file: Excel file with columns: nombre, apellido, email
        - template: image file (optional)
        - positions: JSON string with {x, y, font_size, font_color}
    """
    try:
        event_id = request.data.get('event_id')
        file = request.FILES.get('file')
        template = request.FILES.get('template')
        positions_raw = request.data.get('positions', '{}')
        
        if not event_id or not file:
            return Response(
                {'error': 'event_id y archivo Excel son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from events.models import Event
        event = Event.objects.get(id=event_id)
        
        # Read Excel
        if file.name.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file)
        
        df.columns = df.columns.str.lower().str.strip()
        
        # Validate columns
        required = ['nombre', 'email']
        missing = [c for c in required if c not in df.columns]
        if missing:
            return Response(
                {'error': f'Columnas requeridas: {", ".join(required)}. Encontradas: {list(df.columns)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        positions = json.loads(positions_raw)
        
        # Create temp directory
        temp_dir = tempfile.mkdtemp()
        certs_dir = Path(temp_dir) / 'certificados'
        certs_dir.mkdir(exist_ok=True)
        
        # Save template if provided
        template_path = None
        if template:
            template_path = Path(temp_dir) / 'template.png'
            with open(template_path, 'wb') as f:
                for chunk in template.chunks():
                    f.write(chunk)
        
        # Generate PDFs
        generated = 0
        errors = []
        
        for idx, row in df.iterrows():
            try:
                nombre = str(row.get('nombre', '')).strip()
                apellido = str(row.get('apellido', '')).strip()
                email = str(row.get('email', '')).strip().lower()
                
                if not nombre or '@' not in email:
                    errors.append(f"Fila {idx + 2}: Datos inválidos")
                    continue
                
                name = f"{nombre} {apellido}".strip()
                
                data = {
                    'name': name,
                    'event_name': event.name,
                    'event_date': event.event_date,
                    'instructor_name': event.instructor_name,
                }
                
                filename = f"{nombre}_{apellido}_{uuid.uuid4().hex[:6]}.pdf"
                output_path = certs_dir / filename
                
                if template_path:
                    create_pdf_from_template(str(template_path), data, positions, str(output_path))
                else:
                    create_default_pdf(data, str(output_path))
                
                generated += 1
                
            except Exception as e:
                errors.append(f"Fila {idx + 2}: {str(e)}")
        
        # Create ZIP
        zip_path = Path(temp_dir) / f"certificados_{event.id}.zip"
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for pdf in certs_dir.glob('*.pdf'):
                zf.write(pdf, arcname=pdf.name)
        
        # Return ZIP
        with open(zip_path, 'rb') as f:
            zip_content = f.read()
        
        response = HttpResponse(zip_content, content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="certificados_{event.name}.zip"'
        
        return response
        
    except Exception as e:
        logger.error(f"Error generating from Excel: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


# ─────────────────────────────────────────
# GENERATE SINGLE (METHOD 3)
# ─────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_admin_mode
def generate_single(request):
    """
    Generate a single certificate.
    POST /api/generate/single/
    
    Body:
        - event_id: int
        - name: string
        - email: string
        - template: image file (optional)
        - positions: JSON {x, y, font_size, font_color}
    """
    try:
        event_id = request.data.get('event_id')
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip().lower()
        
        if not event_id or not name:
            return Response(
                {'error': 'event_id y name son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from events.models import Event
        event = Event.objects.get(id=event_id)
        
        data = {
            'name': name,
            'event_name': event.name,
            'event_date': event.event_date,
            'instructor_name': event.instructor_name,
        }
        
        # Create PDF in memory
        pdf_buffer = io.BytesIO()
        
        if request.FILES.get('template'):
            template_buffer = io.BytesIO(request.FILES['template'].read())
            positions_raw = request.data.get('positions', '{}')
            positions = json.loads(positions_raw)
            
            # Save temp template
            temp_dir = tempfile.mkdtemp()
            template_path = Path(temp_dir) / 'template.png'
            with open(template_path, 'wb') as f:
                f.write(template_buffer.getvalue())
            
            create_pdf_from_template(str(template_path), data, positions, str(template_dir) + '/output.pdf')
            
            with open(str(template_dir) + '/output.pdf', 'rb') as f:
                pdf_buffer.write(f.read())
        else:
            create_default_pdf(data, pdf_buffer)
        
        pdf_buffer.seek(0)
        
        response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
        filename = f"certificado_{name.replace(' ', '_')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
        
    except Exception as e:
        logger.error(f"Error generating single: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


# ─────────────────────────────────────────
# GENERATE FROM TEMPLATE (METHOD 4)
# ─────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_admin_mode
@parser_classes([MultiPartParser, FormParser])
def generate_from_template(request, template_id):
    """
    Generate certificates using a saved template.
    POST /api/generate/template/{template_id}/
    
    Body:
        - event_id: int
        - file: Excel with nombre, apellido, email (optional, if not provided uses accepted enrollments)
    """
    try:
        from certificados.models import Template
        from events.models import Event, Invitation
        
        template = Template.objects.get(id=template_id)
        event_id = request.data.get('event_id')
        
        if not event_id:
            return Response(
                {'error': 'event_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        event = Event.objects.get(id=event_id)
        
        # Get accepted invitations
        accepted_invitations = Invitation.objects.filter(
            event=event,
            status='accepted'
        )
        
        # Create temp directory
        temp_dir = tempfile.mkdtemp()
        certs_dir = Path(temp_dir) / 'certificados'
        certs_dir.mkdir(exist_ok=True)
        
        generated = 0
        errors = []
        
        for invitation in accepted_invitations:
            try:
                data = {
                    'name': invitation.student_name,
                    'event_name': event.name,
                    'event_date': event.event_date,
                    'instructor_name': event.instructor_name,
                }
                
                positions = {
                    'x': template.x_coord,
                    'y': template.y_coord,
                    'font_size': template.font_size,
                    'font_color': template.font_color,
                }
                
                filename = f"{invitation.student_name.replace(' ', '_')}_{uuid.uuid4().hex[:6]}.pdf"
                output_path = certs_dir / filename
                
                # Get template image path
                template_img = template.background_url
                if template_img.startswith('/media/'):
                    from django.conf import settings
                    template_img = str(settings.MEDIA_ROOT) + template_img.replace('/media/', '/')
                
                if template_img and Path(template_img).exists():
                    create_pdf_from_template(template_img, data, positions, str(output_path))
                else:
                    create_default_pdf(data, str(output_path))
                
                generated += 1
                
            except Exception as e:
                errors.append(f"{invitation.student_name}: {str(e)}")
        
        if generated == 0:
            return Response(
                {'error': 'No se encontraron estudiantes aceptados para generar certificados'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create ZIP
        zip_path = Path(temp_dir) / f"certificados_{event.id}.zip"
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for pdf in certs_dir.glob('*.pdf'):
                zf.write(pdf, arcname=pdf.name)
        
        with open(zip_path, 'rb') as f:
            zip_content = f.read()
        
        response = HttpResponse(zip_content, content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="certificados_{event.name}.zip"'
        
        return response
        
    except Exception as e:
        logger.error(f"Error generating from template: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


# ─────────────────────────────────────────
# SEND CERTIFICATES
# ─────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_admin_mode
def send_certificates(request):
    """
    Send certificates via email and/or WhatsApp.
    POST /api/send/
    
    Body:
        - event_id: int
        - via: email, whatsapp, both
        - certificates: list of {name, email, phone, pdf_base64} (optional, uses event accepted)
    """
    try:
        event_id = request.data.get('event_id')
        via = request.data.get('via', 'both')
        certificates = request.data.get('certificates', [])
        
        from events.models import Event, Invitation
        from services.whatsapp_service import get_whatsapp_service
        
        event = Event.objects.get(id=event_id)
        
        sent_email = 0
        sent_whatsapp = 0
        errors = []
        
        # If no certificates provided, use accepted invitations
        if not certificates:
            invitations = Invitation.objects.filter(
                event=event,
                status='accepted'
            )
            
            for invitation in invitations:
                try:
                    if via in ['email', 'both']:
                        self._send_certificate_email(
                            invitation.student_email,
                            invitation.student_name,
                            event.name,
                            event.event_date
                        )
                        sent_email += 1
                    
                    if via in ['whatsapp', 'both'] and invitation.phone:
                        self._send_certificate_whatsapp(
                            invitation.phone,
                            invitation.student_name,
                            event.name
                        )
                        sent_whatsapp += 1
                        
                except Exception as e:
                    errors.append(f"{invitation.student_email}: {str(e)}")
        else:
            # Use provided certificates
            for cert in certificates:
                try:
                    email = cert.get('email')
                    phone = cert.get('phone')
                    name = cert.get('name', 'Participante')
                    
                    if via in ['email', 'both'] and email:
                        self._send_certificate_email(
                            email, name, event.name, event.event_date
                        )
                        sent_email += 1
                    
                    if via in ['whatsapp', 'both'] and phone:
                        self._send_certificate_whatsapp(phone, name, event.name)
                        sent_whatsapp += 1
                        
                except Exception as e:
                    errors.append(f"{cert.get('email', 'unknown')}: {str(e)}")
        
        return Response({
            'success': True,
            'sent_email': sent_email,
            'sent_whatsapp': sent_whatsapp,
            'errors': errors
        })
        
    except Exception as e:
        logger.error(f"Error sending certificates: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

send_certificates = require_admin_mode(send_certificates)


# ─────────────────────────────────────────
# HELPER METHODS
# ─────────────────────────────────────────

def _send_certificate_email(self, to_email, name, event_name, event_date):
    """Send certificate email"""
    subject = f"🎓 Tu Certificado - {event_name}"
    
    message = f"""
Hola {name},

¡Felicidades! Tu certificado del evento "{event_name}" está listo.

📅 Fecha del evento: {event_date.strftime('%d/%m/%Y') if hasattr(event_date, 'strftime') else event_date}

Pronto recibirás el PDF adjunto o podrás descargarlo desde nuestro sistema.

¡Gracias por participar!

--
Sistema de Certificados
    """.strip()
    
    email = EmailMessage(
        subject=subject,
        body=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to_email]
    )
    email.send(fail_silently=False)


def _send_certificate_whatsapp(self, phone, name, event_name):
    """Send certificate via WhatsApp"""
    from services.whatsapp_service import get_whatsapp_service
    
    whatsapp = get_whatsapp_service()
    
    message = f"""
🎓 *¡Hola {name}!*

Tu certificado del evento "{event_name}" está listo.

Pronto recibirás el PDF por correo electrónico o podrás descargarlo desde nuestro sistema.

¡Gracias por participar!
    """.strip()
    
    return whatsapp.send_message(phone, message)
