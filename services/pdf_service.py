"""
PDF Generation Service - Create real PDF certificates using reportlab
"""
from reportlab.lib.pagesizes import landscape, A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from django.conf import settings
from django.utils import timezone
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class PDFService:
    """Generate real PDF certificates using reportlab"""

    BASE_WIDTH, BASE_HEIGHT = landscape(A4)
    PDF_PATH = settings.CERTIFICATES_PDF_PATH

    # ── Método principal ──────────────────

    @staticmethod
    def generate_certificate_pdf(certificate, template=None):
        """
        Generate PDF certificate.
        Si el template tiene imagen de fondo y coordenadas, las usa.
        Si no, genera el formato por defecto.

        Args:
            certificate: Certificate object
            template: Template object (opcional)

        Returns:
            dict: {'success': bool, 'path': str, 'filename': str, 'message': str}
        """
        try:
            PDFService.PDF_PATH.mkdir(parents=True, exist_ok=True)

            filename = (
                f"{certificate.student.id}_"
                f"{certificate.event.id}_"
                f"{certificate.verification_code}.pdf"
            )
            filepath = PDFService.PDF_PATH / filename

            # Usar template con imagen si está disponible
            if template and template.background_url:
                return PDFService._generate_with_template(
                    certificate, template, filepath, filename
                )

            # Fallback: formato por defecto
            return PDFService._generate_default(certificate, filepath, filename)

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error generating PDF: {error_msg}")
            return {
                'success': False,
                'path': None,
                'message': f'PDF generation error: {error_msg}'
            }

    # ── Generación con template ───────────

    @staticmethod
    def _generate_with_template(certificate, template, filepath, filename):
        """Genera el PDF usando la imagen de fondo y coordenadas del template."""
        from PIL import Image
        from reportlab.lib.utils import ImageReader
        import os

        img_path = template.background_url
        if img_path.startswith('/media/'):
            img_path = os.path.join(
                settings.MEDIA_ROOT,
                img_path.replace('/media/', '')
            )

        if not os.path.exists(img_path):
            logger.warning(
                f"Template background not found: {img_path}. Falling back to default."
            )
            return PDFService._generate_default(certificate, filepath, filename)

        img = Image.open(img_path)
        img_width, img_height = img.size

        c = canvas.Canvas(str(filepath), pagesize=(img_width, img_height))

        # Imagen de fondo
        c.drawImage(
            ImageReader(img),
            0, 0,
            width=img_width,
            height=img_height
        )

        # Fuente y color del template
        c.setFont(template.font_family, template.font_size)
        hex_color = template.font_color.lstrip('#')
        r, g, b = (int(hex_color[i:i+2], 16) / 255.0 for i in (0, 2, 4))
        c.setFillColorRGB(r, g, b)

        # Nombre del estudiante
        nombre_completo = (
            f"{certificate.student.first_name} {certificate.student.last_name}"
        )
        palabras = nombre_completo.split()

        if len(palabras) >= 2:
            c.drawString(
                template.x_coord,
                template.y_coord + (template.font_size * 0.8),
                palabras[0]
            )
            c.drawString(
                template.x_coord,
                template.y_coord,
                ' '.join(palabras[1:])
            )
        else:
            c.drawString(template.x_coord, template.y_coord, nombre_completo)

        c.save()

        logger.info(f"PDF generated with template: {filepath}")

        return {
            'success': True,
            'path': f'/certificates/pdfs/{filename}',
            'filename': filename,
            'message': 'PDF generated successfully'
        }

    # ── Generación por defecto ────────────

    @staticmethod
    def _generate_default(certificate, filepath, filename):
        """Genera el PDF con el formato por defecto (sin imagen de fondo)."""
        color_primary = HexColor('#1e3a8a')
        color_secondary = HexColor('#94a3b8')

        c = canvas.Canvas(str(filepath), pagesize=landscape(A4))

        # Fondo
        c.setFillColor(HexColor('#f8fafc'))
        c.rect(
            0, 0,
            PDFService.BASE_WIDTH, PDFService.BASE_HEIGHT,
            fill=True, stroke=False
        )

        # Borde
        c.setLineWidth(3)
        c.setStrokeColor(color_primary)
        c.rect(
            0.3 * inch, 0.3 * inch,
            PDFService.BASE_WIDTH - 0.6 * inch,
            PDFService.BASE_HEIGHT - 0.6 * inch
        )

        # Título
        c.setFont("Helvetica-Bold", 48)
        c.setFillColor(color_primary)
        c.drawCentredString(
            PDFService.BASE_WIDTH / 2,
            PDFService.BASE_HEIGHT - 1.5 * inch,
            "CERTIFICADO"
        )

        # Subtítulo
        c.setFont("Helvetica", 24)
        c.setFillColor(color_secondary)
        c.drawCentredString(
            PDFService.BASE_WIDTH / 2,
            PDFService.BASE_HEIGHT - 2.2 * inch,
            "DE ASISTENCIA Y PARTICIPACIÓN"
        )

        # Nombre del estudiante
        c.setFont("Helvetica-Bold", 28)
        c.setFillColor(color_primary)
        student_name = (
            f"{certificate.student.first_name} {certificate.student.last_name}"
        ).upper()
        c.drawCentredString(
            PDFService.BASE_WIDTH / 2,
            PDFService.BASE_HEIGHT - 3.2 * inch,
            student_name
        )

        # Evento
        y_pos = PDFService.BASE_HEIGHT - 4 * inch
        y_pos -= 0.4 * inch
        c.setFont("Helvetica-Bold", 18)
        c.setFillColor(color_primary)
        c.drawString(1.5 * inch, y_pos, certificate.event.name.upper())

        y_pos -= 0.5 * inch
        c.setFont("Helvetica", 14)
        c.setFillColor(color_secondary)
        c.drawString(
            1.5 * inch, y_pos,
            f"Realizado el: {certificate.event.event_date.strftime('%d de %B de %Y')}"
        )

        # Detalles
        y_pos -= 0.8 * inch
        c.setFont("Helvetica", 10)
        c.setFillColor(color_secondary)
        c.drawString(1 * inch, y_pos, f"Código de Verificación: {certificate.verification_code}")
        y_pos -= 0.25 * inch
        c.drawString(1 * inch, y_pos, f"Válido hasta: {certificate.expires_at.strftime('%d/%m/%Y')}")
        y_pos -= 0.25 * inch
        c.drawString(
            1 * inch, y_pos,
            f"Emitido el: {timezone.now().strftime('%d/%m/%Y a las %H:%M')}"
        )

        # Firma y QR
        y_pos -= 0.8 * inch
        c.setFont("Helvetica-Bold", 12)
        c.setFillColor(color_primary)
        c.drawString(1 * inch, y_pos, "Autorizado por:")
        c.drawString(7 * inch, y_pos, "Código QR:")

        y_pos -= 0.3 * inch
        c.setFont("Helvetica", 10)
        c.setFillColor(color_secondary)
        c.drawString(1 * inch, y_pos, "Sistema de Certificación")
        c.drawString(7 * inch, y_pos, "[QR Aquí]")

        # Footer
        c.setFont("Helvetica", 8)
        c.setFillColor(HexColor('#cbd5e1'))
        c.drawString(0.5 * inch, 0.3 * inch, f"ID: {certificate.id}")
        c.drawCentredString(
            PDFService.BASE_WIDTH / 2, 0.3 * inch,
            "www.certificados.example.com"
        )
        c.drawRightString(PDFService.BASE_WIDTH - 0.5 * inch, 0.3 * inch, "© 2026")

        c.save()

        logger.info(f"PDF generated (default): {filepath}")

        return {
            'success': True,
            'path': f'/certificates/pdfs/{filename}',
            'filename': filename,
            'message': 'PDF generated successfully'
        }

    # ── Generación masiva ─────────────────

    @staticmethod
    def generate_bulk_pdfs(certificates):
        """
        Generate PDFs for multiple certificates.

        Args:
            certificates: Queryset of Certificate objects

        Returns:
            dict: {'generated': int, 'failed': int, 'errors': list}
        """
        results = {
            'generated': 0,
            'failed': 0,
            'errors': []
        }

        for cert in certificates:
            result = PDFService.generate_certificate_pdf(cert)

            if result['success']:
                cert.pdf_url = result['path']
                cert.save()
                results['generated'] += 1
            else:
                results['failed'] += 1
                results['errors'].append({
                    'certificate_id': str(cert.id),
                    'error': result['message']
                })

        return results