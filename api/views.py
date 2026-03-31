"""
ViewSets (views) for Certificate and Delivery APIs
"""
from rest_framework import viewsets, status, permissions, serializers
from rest_framework.decorators import action, api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from django.http import HttpResponse
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import openpyxl
import csv
import zipfile
import io
import pandas as pd
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PIL import Image

from certificados.models import Certificate, Template
from deliveries.models import DeliveryLog
from students.models import Student
from events.models import Event, Enrollment
from .serializers import (
    CertificateListSerializer,
    CertificateDetailSerializer,
    CertificateCreateSerializer,
    CertificateGenerateSerializer,
    CertificateDeliverSerializer,
    DeliveryLogSerializer,
)


# ─────────────────────────────────────────
# PERMISOS PERSONALIZADOS
# ─────────────────────────────────────────

class IsAdminUserOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


class IsCertificateOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_staff


# ─────────────────────────────────────────
# SERIALIZERS INLINE
# ─────────────────────────────────────────

class TemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = [
            'id', 'name', 'category', 'background_url', 'preview_url',
            'x_coord', 'y_coord', 'font_size', 'font_color', 'font_family',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


# ─────────────────────────────────────────
# VIEWSETS
# ─────────────────────────────────────────

class CertificateViewSet(viewsets.ModelViewSet):
    queryset = Certificate.objects.all()

    def get_queryset(self):
        if self.request.user.is_staff:
            return Certificate.objects.all().select_related(
                'student', 'event', 'template', 'generated_by'
            )
        return Certificate.objects.filter(
            student__user=self.request.user
        ).select_related('student', 'event', 'template', 'generated_by')

    def get_serializer_class(self):
        if self.action == 'create':
            return CertificateCreateSerializer
        elif self.action == 'generate':
            return CertificateGenerateSerializer
        elif self.action == 'deliver':
            return CertificateDeliverSerializer
        elif self.action == 'list':
            return CertificateListSerializer
        return CertificateDetailSerializer

    def get_permissions(self):
        if self.action == 'verify':
            self.permission_classes = [permissions.AllowAny]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
        elif self.action in ['generate', 'deliver']:
            self.permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
        else:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()

    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        certificate = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            template_id = serializer.validated_data.get('template_id')
            if template_id:
                template = Template.objects.get(id=template_id)
                certificate.template = template
            certificate.generate()
            return Response({
                'status': 'success',
                'message': 'Certificate generated successfully',
                'certificate': CertificateDetailSerializer(certificate).data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'Failed to generate certificate: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def deliver(self, request, pk=None):
        certificate = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        method = serializer.validated_data['method']
        recipient = serializer.validated_data.get('recipient')
        try:
            with transaction.atomic():
                certificate.deliver(
                    method=method,
                    recipient=recipient,
                    sent_by=request.user
                )
                return Response({
                    'status': 'success',
                    'message': f'Certificate delivered via {method}',
                    'delivery_log': DeliveryLogSerializer(
                        certificate.last_delivery_attempt
                    ).data,
                    'certificate': CertificateDetailSerializer(certificate).data
                }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'Failed to deliver certificate: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        certificate = self.get_object()
        delivery_logs = certificate.get_delivery_history()
        return Response({
            'certificate_id': str(certificate.id),
            'total_attempts': delivery_logs.count(),
            'deliveries': DeliveryLogSerializer(delivery_logs, many=True).data
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def verify(self, request):
        code = request.query_params.get('code')
        if not code:
            return Response({
                'status': 'error',
                'message': 'Verification code is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        try:
            certificate = Certificate.objects.get(verification_code=code)
            if certificate.is_expired():
                return Response({
                    'status': 'error',
                    'message': 'Certificate has expired',
                    'certificate': CertificateDetailSerializer(certificate).data
                }, status=status.HTTP_410_GONE)
            return Response({
                'status': 'success',
                'message': 'Certificate verified successfully',
                'certificate': CertificateDetailSerializer(certificate).data
            }, status=status.HTTP_200_OK)
        except Certificate.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Certificate not found'
            }, status=status.HTTP_404_NOT_FOUND)


class DeliveryLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DeliveryLog.objects.all().select_related(
        'certificate', 'sent_by'
    ).order_by('-sent_at')
    serializer_class = DeliveryLogSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get_queryset(self):
        queryset = super().get_queryset()
        cert_id = self.request.query_params.get('certificate_id')
        if cert_id:
            queryset = queryset.filter(certificate__id=cert_id)
        return queryset


# ─────────────────────────────────────────
# ENDPOINTS DE TEMPLATES (con autenticación)
# ─────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def crear_template_con_imagen(request):
    """
    Crear template con imagen y coordenadas.
    POST /api/templates/crear/
    Body: multipart/form-data con:
        - name: nombre del template
        - imagen: archivo de imagen
        - x_coord: coordenada X
        - y_coord: coordenada Y
        - font_size: tamaño de fuente
        - font_color: color en hex (default #000000)
        - event_id: ID del evento (opcional)
    """
    try:
        name = request.data.get('name')
        imagen = request.FILES.get('imagen')
        x_coord = float(request.data.get('x_coord', 200))
        y_coord = float(request.data.get('y_coord', 300))
        font_size = int(request.data.get('font_size', 24))
        font_color = request.data.get('font_color', '#000000')
        event_id = request.data.get('event_id')

        if not name or not imagen:
            return Response({
                'error': 'Se requiere nombre e imagen'
            }, status=status.HTTP_400_BAD_REQUEST)

        file_path = default_storage.save(
            f'templates/{imagen.name}',
            ContentFile(imagen.read())
        )

        template = Template.objects.create(
            created_by=request.user,
            name=name,
            background_url=default_storage.url(file_path),
            x_coord=x_coord,
            y_coord=y_coord,
            font_size=font_size,
            font_color=font_color,
            is_active=True
        )

        if event_id:
            try:
                event = Event.objects.get(id=event_id)
                event.template = template
                event.save()
            except Event.DoesNotExist:
                pass

        return Response({
            'success': True,
            'template': TemplateSerializer(template).data,
            'message': 'Template creado exitosamente'
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_templates(request):
    """
    Listar templates del usuario autenticado.
    GET /api/templates/
    """
    templates = Template.objects.filter(
        created_by=request.user,
        is_active=True
    ).order_by('-created_at')

    return Response(TemplateSerializer(templates, many=True).data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def actualizar_template(request, template_id):
    """
    Actualizar coordenadas y estilo de un template.
    PUT /api/templates/<template_id>/
    """
    try:
        template = Template.objects.get(id=template_id, created_by=request.user)

        if 'x_coord' in request.data:
            template.x_coord = float(request.data['x_coord'])
        if 'y_coord' in request.data:
            template.y_coord = float(request.data['y_coord'])
        if 'font_size' in request.data:
            template.font_size = int(request.data['font_size'])
        if 'font_color' in request.data:
            template.font_color = request.data['font_color']
        if 'font_family' in request.data:
            template.font_family = request.data['font_family']

        template.save()

        return Response({
            'success': True,
            'template': TemplateSerializer(template).data
        })

    except Template.DoesNotExist:
        return Response({
            'error': 'Template no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)


# ─────────────────────────────────────────
# ENDPOINTS CUSTOM SIN AUTENTICACIÓN
# ─────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def import_students_and_create_certs(request):
    """
    Importa estudiantes desde Excel y crea certificados.
    POST /api/import/
    Body: multipart/form-data con 'file' y 'event_id'
    """
    archivo = request.FILES.get('file')
    event_id = request.data.get('event_id')

    if not archivo or not event_id:
        return Response({'error': 'Se requiere file y event_id'}, status=400)

    try:
        event = Event.objects.get(id=event_id)
    except Event.DoesNotExist:
        return Response({'error': 'Evento no encontrado'}, status=404)

    estudiantes = []
    nombre_archivo = archivo.name.lower()

    if nombre_archivo.endswith('.csv'):
        decoded = archivo.read().decode('utf-8').splitlines()
        reader = csv.DictReader(decoded)
        for row in reader:
            estudiantes.append(row)
    else:
        wb = openpyxl.load_workbook(archivo)
        ws = wb.active
        headers = [cell.value for cell in ws[1]]
        for row in ws.iter_rows(min_row=2, values_only=True):
            estudiantes.append(dict(zip(headers, row)))

    creados = 0
    certs_creados = 0
    errores = []

    for data in estudiantes:
        try:
            email = str(data.get('email', '')).strip()
            if not email or email == 'None':
                continue

            student, _ = Student.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': str(data.get('first_name', '')).strip(),
                    'last_name':  str(data.get('last_name', '')).strip(),
                    'document_id': str(data.get('document_id', email)).strip(),
                    'phone': str(data.get('phone', '')).strip(),
                }
            )
            creados += 1

            Enrollment.objects.get_or_create(student=student, event=event)

            cert, created = Certificate.objects.get_or_create(
                student=student,
                event=event,
                defaults={'status': 'pending'}
            )
            if created:
                certs_creados += 1

        except Exception as e:
            errores.append(str(e))

    return Response({
        'ok': True,
        'estudiantes_procesados': creados,
        'certificados_creados': certs_creados,
        'errores': errores[:5]
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def listar_eventos(request):
    """GET /api/eventos/"""
    eventos = Event.objects.filter(is_active=True).values(
        'id', 'name', 'category', 'event_date'
    )
    return Response(list(eventos))


@api_view(['GET'])
@permission_classes([AllowAny])
def listar_certificados(request):
    """GET /api/certs/?event_id=1"""
    event_id = request.query_params.get('event_id')
    if not event_id:
        return Response({'error': 'Se requiere event_id'}, status=400)

    certs = Certificate.objects.filter(
        event_id=event_id
    ).select_related('student').order_by('student__first_name')

    data = [{
        'id': c.id,
        'status': c.status,
        'student_name': c.student.first_name + ' ' + c.student.last_name,
        'student_email': c.student.email,
    } for c in certs]

    return Response(data)


@api_view(['POST'])
@permission_classes([AllowAny])
def generar_todos(request):
    """POST /api/generar/ body: {event_id: 1}"""
    event_id = request.data.get('event_id')
    if not event_id:
        return Response({'error': 'Se requiere event_id'}, status=400)

    certs = Certificate.objects.filter(event_id=event_id, status='pending')
    ok = 0
    errores = []

    for cert in certs:
        try:
            cert.generate()
            ok += 1
        except Exception as e:
            errores.append(f'{cert.student.email}: {str(e)}')

    return Response({'generados': ok, 'errores': errores[:5]})


@api_view(['POST'])
@permission_classes([AllowAny])
def enviar_todos(request):
    """POST /api/enviar/ body: {event_id: 1}"""
    event_id = request.data.get('event_id')
    if not event_id:
        return Response({'error': 'Se requiere event_id'}, status=400)

    certs = Certificate.objects.filter(event_id=event_id, status='generated')
    ok = 0
    errores = []

    for cert in certs:
        try:
            cert.deliver(method='email', recipient=cert.student.email)
            ok += 1
        except Exception as e:
            errores.append(f'{cert.student.email}: {str(e)}')

    return Response({'enviados': ok, 'errores': errores[:5]})


@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def generar_certificados_publico(request):
    """
    Modo Público: Genera certificados sin autenticación.
    POST /api/publico/generar/
    Body: multipart/form-data con:
        - imagen: archivo de imagen (PNG/JPG)
        - excel: archivo Excel con estudiantes
        - x_coord: coordenada X para el nombre (float)
        - y_coord: coordenada Y para el nombre (float)
        - font_size: tamaño de fuente (int, default 24)
    Returns: ZIP con todos los PDFs generados
    """
    try:
        imagen_plantilla = request.FILES.get('imagen')
        archivo_excel = request.FILES.get('excel')
        x_coord = float(request.data.get('x_coord', 200))
        y_coord = float(request.data.get('y_coord', 300))
        font_size = int(request.data.get('font_size', 24))

        if not imagen_plantilla or not archivo_excel:
            return Response({
                'error': 'Debes subir la imagen plantilla y el archivo Excel'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_excel(archivo_excel)
        except Exception as e:
            return Response({
                'error': f'Error al leer el Excel: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

        required_columns = ['first_name', 'last_name', 'email']
        missing_columns = [col for col in required_columns if col not in df.columns]

        if missing_columns:
            return Response({
                'error': f'Faltan columnas requeridas: {", ".join(missing_columns)}',
                'required_columns': required_columns
            }, status=status.HTTP_400_BAD_REQUEST)

        zip_buffer = io.BytesIO()
        generated_count = 0
        errors = []

        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for idx, row in df.iterrows():
                try:
                    nombre = str(row['first_name']).strip()
                    apellido = str(row['last_name']).strip()
                    nombre_completo = f"{nombre} {apellido}"
                    document_id = str(row.get('document_id', f'estudiante_{idx}')).strip()

                    pdf_buffer = io.BytesIO()

                    img = Image.open(imagen_plantilla)
                    img_width, img_height = img.size

                    c = canvas.Canvas(pdf_buffer, pagesize=(img_width, img_height))
                    c.drawImage(
                        ImageReader(img),
                        0, 0,
                        width=img_width,
                        height=img_height,
                        preserveAspectRatio=True,
                        mask='auto'
                    )

                    c.setFont("Helvetica-Bold", font_size)
                    c.setFillColorRGB(0, 0, 0)

                    palabras = nombre_completo.split()
                    if len(palabras) >= 2:
                        c.drawString(x_coord, y_coord + (font_size * 0.8), palabras[0])
                        c.drawString(x_coord, y_coord, ' '.join(palabras[1:]))
                    else:
                        c.drawString(x_coord, y_coord, nombre_completo)

                    c.save()

                    filename = f"{nombre}_{apellido}_{document_id}.pdf"
                    filename = filename.replace(' ', '_').replace('/', '_').replace('\\', '_')

                    zip_file.writestr(filename, pdf_buffer.getvalue())
                    generated_count += 1

                except Exception as e:
                    errors.append(f"{nombre_completo}: {str(e)}")
                    continue

        zip_buffer.seek(0)
        response = HttpResponse(zip_buffer.getvalue(), content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename="certificados_generados.zip"'
        return response

    except Exception as e:
        return Response({
            'error': f'Error general: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)