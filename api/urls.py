# api/urls.py

from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import (
    CertificateViewSet,
    DeliveryLogViewSet,
    import_students_and_create_certs,
    listar_eventos,
    listar_certificados,
    generar_todos,
    enviar_todos,
    generar_certificados_publico,
    crear_template_con_imagen,
    listar_templates,
    actualizar_template,
)

router = SimpleRouter()
router.register(r'certificates', CertificateViewSet, basename='certificate')
router.register(r'deliveries', DeliveryLogViewSet, basename='delivery')

urlpatterns = [
    path('', include(router.urls)),

    # Importación y gestión
    path('import/', import_students_and_create_certs),
    path('eventos/', listar_eventos),
    path('certs/', listar_certificados),
    path('generar/', generar_todos),
    path('enviar/', enviar_todos),

    # Modo público (sin autenticación)
    path('publico/generar/', generar_certificados_publico, name='generar_publico'),

    # Templates (requieren autenticación)
    path('templates/crear/', crear_template_con_imagen, name='crear_template'),
    path('templates/', listar_templates, name='listar_templates'),
    path('templates/<int:template_id>/', actualizar_template, name='actualizar_template'),
]