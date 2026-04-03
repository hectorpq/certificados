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
from PIL import Image, ImageDraw, ImageFont
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
    Procesa archivo Excel y extrae nombre, apellido, email
    Expect columnas: "Nombres" o "Nombre", y "Apellidos" o "Apellido", "Email"
    """
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
        
        # Normalizar nombres de columnas
        col_rename = {}
        for col in df.columns:
            if 'nombre' in col and col not in ['nombres', 'apellidos']:
                col_rename[col] = 'nombres'
            elif 'apellido' in col:
                col_rename[col] = 'apellidos'
            elif 'email' in col or 'correo' in col:
                col_rename[col] = 'email'
        df.rename(columns=col_rename, inplace=True)
        
        # Validar columnas requeridas
        columnas_faltantes = []
        if 'nombres' not in df.columns:
            columnas_faltantes.append('nombres')
        if 'apellidos' not in df.columns:
            columnas_faltantes.append('apellidos')
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
            nombre = str(row['nombres']).strip()
            apellido = str(row['apellidos']).strip()
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


def _colocar_texto_en_imagen(img_path, nombre, apellido, posiciones, output_path):
    """
    Coloca el texto (nombre + apellido) en la imagen según las posiciones
    
    Args:
        img_path: Path a la imagen original
        nombre: Nombre a escribir
        apellido: Apellido a escribir
        posiciones: dict con {x, y, fontSize, fontColor}
        output_path: Path donde guardar la imagen con el texto
    """
    try:
        # Abrir imagen original
        img = Image.open(img_path)
        draw = ImageDraw.Draw(img)
        
        # Preparar texto
        texto_completo = f"{nombre} {apellido}"
        
        # Intentar cargar una fuente
        try:
            fuente = ImageFont.truetype("arial.ttf", posiciones.get('fontSize', 32))
        except:
            try:
                fuente = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", posiciones.get('fontSize', 32))
            except:
                fuente = ImageFont.load_default()
        
        # Dibujar texto
        color = posiciones.get('fontColor', '#000000')
        # Convertir hex a RGB
        if color.startswith('#'):
            color = tuple(int(color[i:i+2], 16) for i in (1, 3, 5))
        
        x = posiciones.get('x', 250)
        y = posiciones.get('y', 300)
        
        draw.text((x, y), texto_completo, fill=color, font=fuente)
        
        # Guardar
        img.save(output_path)
        return True
    
    except Exception as e:
        logger.error(f"Error colocando texto: {str(e)}")
        raise


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def crear_masivo(request):
    """
    Crea los certificados en masa y envía por email
    
    Recibe:
    - template: imagen PNG/JPG
    - datos: JSON con lista de {nombre, apellido, email}
    - posiciones: JSON con {x, y, fontSize, fontColor}
    """
    
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
                
                # Crear imagen con texto
                filename = f"{nombre.replace(' ', '_')}_{apellido.replace(' ', '_')}.png"
                output_path = certificados_dir / filename
                
                _colocar_texto_en_imagen(
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
                logger.error(f"Error procesando {registro['nombre']}: {str(e)}")
                errores += 1
        
        # Crear ZIP con todos los certificados
        zip_path = Path(temp_dir) / 'certificados.zip'
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for archivo in certificados_dir.glob('*.png'):
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
