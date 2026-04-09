"""
Generador masivo de certificados - Vistas para el flujo simplificado
"""
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import EmailMessage
from django.conf import settings
from django.http import FileResponse
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib.pagesizes import landscape
from io import BytesIO
import pandas as pd
import json
import tempfile
import zipfile
import io
import os
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def procesar_excel(request):
    """
    Procesa archivo Excel y extrae nombre, apellido, email.
    Requiere autenticación y modo admin activo.
    Expect columnas: "Nombres" o "Nombre", y "Apellidos" o "Apellido", "Email"
    """
    # Verificar modo admin
    if not request.user.is_admin_mode:
        return Response(
            {'error': 'Solo disponible en modo administrador'},
            status=status.HTTP_403_FORBIDDEN
        )

    logger.info(f"procesar_excel - User: {request.user}, Files: {list(request.FILES.keys())}")
    
    if 'file' not in request.FILES:
        logger.error(f"No file in request. Available: {list(request.FILES.keys())}")
        return Response(
            {'error': f'No archivo. Received keys: {list(request.FILES.keys())}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        archivo = request.FILES['file']
        logger.info(f"Procesando archivo: {archivo.name}")
        
        # Leer Excel
        df = pd.read_excel(archivo)
        df.columns = df.columns.str.lower().str.strip()
        logger.info(f"Columnas encontradas: {list(df.columns)}")
        
        # Normalizar nombres de columnas (soportar nombre/nombres y apellido/apellidos)
        col_rename = {}
        for col in df.columns:
            if 'nombre' in col.lower() and col not in ['nombre', 'nombres', 'apellido', 'apellidos']:
                col_rename[col] = 'nombre'
            elif 'apellido' in col.lower() and col not in ['nombre', 'nombres', 'apellido', 'apellidos']:
                col_rename[col] = 'apellido'
            elif 'email' in col.lower() or 'correo' in col.lower():
                if 'email' not in df.columns:
                    col_rename[col] = 'email'
        df.rename(columns=col_rename, inplace=True)
        
        # Normalizar nombres de columnas a nombre/apellido
        if 'nombres' in df.columns:
            df.rename(columns={'nombres': 'nombre'}, inplace=True)
        if 'apellidos' in df.columns:
            df.rename(columns={'apellidos': 'apellido'}, inplace=True)
        
        # Validar columnas requeridas
        columnas_faltantes = []
        if 'nombre' not in df.columns:
            columnas_faltantes.append('nombre')
        if 'apellido' not in df.columns:
            columnas_faltantes.append('apellido')
        if 'email' not in df.columns:
            columnas_faltantes.append('email')
        
        if columnas_faltantes:
            return Response(
                {'error': f'Columnas requeridas: {", ".join(columnas_faltantes)}. Encontradas: {list(df.columns)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extraer datos
        datos = []
        for idx, row in df.iterrows():
            nombre = str(row['nombre']).strip()
            apellido = str(row['apellido']).strip()
            email = str(row['email']).strip().lower()
            
            # Validar email
            if '@' not in email or '.' not in email.split('@')[1]:
                logger.warning(f"Email inválido en fila {idx + 2}: {email}")
                continue
            
            datos.append({
                'nombre': nombre,
                'apellido': apellido,
                'email': email
            })
        
        if not datos:
            return Response(
                {'error': 'No se encontraron datos válidos con emails correctos en el Excel'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"Excel procesado: {len(datos)} registros válidos")
        return Response({
            'success': True,
            'datos': datos
        })
    
    except Exception as e:
        logger.error(f"Error procesando Excel: {str(e)}", exc_info=True)
        return Response(
            {'error': f'Error: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


def _crear_pdf_desde_template(img_path, nombre, apellido, posiciones, output_path):
    """
    Crea un PDF certificado usando la imagen como fondo y coloca el texto.
    
    Args:
        img_path: Path a la imagen template
        nombre: Nombre a escribir
        apellido: Apellido a escribir
        posiciones: dict con {x, y, fontSize, fontColor}
        output_path: Path donde guardar el PDF
    """
    try:
        # Abrir imagen para obtener dimensiones
        img = Image.open(img_path)
        img_width, img_height = img.size
        
        # Crear PDF con las mismas dimensiones
        c = canvas.Canvas(output_path, pagesize=(img_width, img_height))
        
        # Dibujar imagen de fondo
        c.drawImage(
            ImageReader(img_path),
            0, 0,
            width=img_width,
            height=img_height
        )
        
        # Configurar texto
        font_size = posiciones.get('fontSize', 32)
        font_color = posiciones.get('fontColor', '#000000')
        
        # Convertir color hex a RGB
        if font_color.startswith('#'):
            hex_color = font_color.lstrip('#')
            r, g, b = (int(hex_color[i:i+2], 16) / 255.0 for i in (0, 2, 4))
            c.setFillColorRGB(r, g, b)
        else:
            c.setFillColor(font_color)
        
        c.setFont("Helvetica-Bold", font_size)
        
        # Posicionar texto
        x = posiciones.get('x', img_width / 2)
        y = posiciones.get('y', img_height / 2)
        
        # Escribir nombre y apellido en líneas separadas
        nombre_completo = f"{nombre} {apellido}"
        palabras = nombre_completo.split()
        
        if len(palabras) >= 2:
            c.drawString(x, y + (font_size * 0.8), palabras[0])
            c.drawString(x, y, ' '.join(palabras[1:]))
        else:
            c.drawString(x, y, nombre_completo)
        
        c.save()
        return True
    
    except Exception as e:
        logger.error(f"Error creando PDF: {str(e)}")
        raise


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def crear_masivo(request):
    """
    Crea los certificados en masa y envía por email.
    Requiere autenticación y modo admin activo.

    Recibe:
    - template: imagen PNG/JPG
    - datos: JSON con lista de {nombre, apellido, email}
    - posiciones: JSON con {x, y, fontSize, fontColor}
    """
    # Verificar modo admin
    if not request.user.is_admin_mode:
        return Response(
            {'error': 'Solo disponible en modo administrador'},
            status=status.HTTP_403_FORBIDDEN
        )

    if 'template' not in request.FILES:
        return Response(
            {'error': 'No se subió template'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        template_file = request.FILES['template']
        datos_raw = request.POST.get('datos')
        posiciones_raw = request.POST.get('posiciones')
        
        if not datos_raw or not posiciones_raw:
            return Response(
                {'error': 'Faltan datos o posiciones'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        datos = json.loads(datos_raw)
        posiciones = json.loads(posiciones_raw)
        
        # Crear directorio temporal para certificados
        temp_dir = tempfile.mkdtemp()
        certificados_dir = Path(temp_dir) / 'certificados'
        certificados_dir.mkdir(exist_ok=True)
        
        # Guardar template temporalmente
        template_path = Path(temp_dir) / 'template.png'
        with open(template_path, 'wb') as f:
            for chunk in template_file.chunks():
                f.write(chunk)
        
        generados = 0
        errores = 0
        emails_enviados = []
        
        # Procesar cada registro
        for idx, registro in enumerate(datos):
            try:
                nombre = registro['nombre']
                apellido = registro['apellido']
                email = registro['email']
                
                # Crear PDF con texto
                filename = f"{nombre.replace(' ', '_')}_{apellido.replace(' ', '_')}.pdf"
                output_path = certificados_dir / filename
                
                _crear_pdf_desde_template(
                    str(template_path),
                    nombre,
                    apellido,
                    posiciones,
                    str(output_path)
                )
                
                # Enviar por email
                try:
                    msg = EmailMessage(
                        subject=f"🎓 Tu Certificado - {nombre} {apellido}",
                        body=f"Hola {nombre},\n\nTe enviamos tu certificado en el adjunto.\n\nFelicidades!",
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        to=[email],
                    )
                    msg.attach_file(str(output_path))
                    msg.send(fail_silently=False)
                    emails_enviados.append(email)
                except Exception as e:
                    logger.error(f"Error enviando a {email}: {str(e)}")
                
                generados += 1
                
            except Exception as e:
                logger.error(f"Error procesando {registro.get('nombre', 'unknown')}: {str(e)}")
                errores += 1
        
        # Crear ZIP con todos los certificados PDF
        zip_path = Path(temp_dir) / 'certificados.zip'
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for archivo in certificados_dir.glob('*.pdf'):
                zf.write(archivo, arcname=archivo.name)
        
        # Retornar ZIP como descarga
        with open(zip_path, 'rb') as f:
            zip_content = f.read()
        
        response = FileResponse(
            io.BytesIO(zip_content),
            content_type='application/zip',
            as_attachment=True,
            filename='certificados.zip'
        )
        
        # Agregar headers adicionales
        response['X-Generados'] = str(generados)
        response['X-Errores'] = str(errores)
        response['X-Emails'] = str(len(emails_enviados))
        
        logger.info(f"Descarga completada: {generados} certificados, {len(emails_enviados)} emails enviados")
        
        return response
    
    except Exception as e:
        logger.error(f"Error en crear_masivo: {str(e)}")
        return Response(
            {'error': f'Error al generar: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
