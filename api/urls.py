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
    estado_acceso_publico,
    crear_template_con_imagen,
    listar_templates,
    actualizar_template,
    mi_perfil,
    mis_eventos,
    mis_certificados,
    toggle_admin_mode,
    crear_evento,
    guardar_app_password,
)
from .generador_views import procesar_excel, crear_masivo
from .views import generar_certificados_evento, enviar_certificados_evento, generar_certificados_aceptados, listar_certificados_evento
from .events_views import (
    EventViewSet,
    public_invitation,
    accept_invitation,
    decline_invitation,
)
from .generation_views import (
    generate_from_excel,
    generate_single,
    generate_from_template,
    send_certificates,
)
from .views import google_auth, test_email_config

router = SimpleRouter()
router.register(r'certificates', CertificateViewSet, basename='certificate')
router.register(r'deliveries', DeliveryLogViewSet, basename='delivery')
router.register(r'events', EventViewSet, basename='event')

urlpatterns = [
    path('', include(router.urls)),

    # Autenticación
    path('auth/google/', google_auth, name='google_auth'),

    # Invitaciones públicas
    path('invitation/<str:token>/', public_invitation, name='public_invitation'),
    path('invitation/<str:token>/accept/', accept_invitation, name='accept_invitation'),
    path('invitation/<str:token>/decline/', decline_invitation, name='decline_invitation'),

    # Generación de certificados
    path('generate/excel/', generate_from_excel, name='generate_excel'),
    path('generate/single/', generate_single, name='generate_single'),
    path('generate/template/<int:template_id>/', generate_from_template, name='generate_template'),
    path('send/', send_certificates, name='send_certificates'),

    # Importación y gestión
    path('import/', import_students_and_create_certs),
    path('eventos/', listar_eventos),
    path('eventos/crear/', crear_evento, name='crear_evento'),
    path('certs/', listar_certificados),
    path('generar/', generar_todos),
    path('enviar/', enviar_todos),

    # Eventos por ID - Generación de certificados
    path('events/<int:event_id>/generar/', generar_certificados_evento, name='event_generar'),
    path('events/<int:event_id>/enviar-certificados/', enviar_certificados_evento, name='event_enviar'),
    path('events/<int:event_id>/generar-aceptados/', generar_certificados_aceptados, name='event_generar_aceptados'),
    path('events/<int:event_id>/certificados/', listar_certificados_evento, name='event_certificados'),

    # Modo público (sin autenticación)
    path('publico/generar/', generar_certificados_publico, name='generar_publico'),
    path('publico/estado/', estado_acceso_publico, name='estado_acceso_publico'),

    # Templates (requieren autenticación)
    path('templates/crear/', crear_template_con_imagen, name='crear_template'),
    path('templates/', listar_templates, name='listar_templates'),
    path('templates/<int:template_id>/', actualizar_template, name='actualizar_template'),

    # Generador masivo (nuevo)
    path('generar/procesar-excel/', procesar_excel, name='procesar_excel'),
    path('generar/crear-masivo/', crear_masivo, name='crear_masivo'),

    # Perfil y modo admin
    path('perfil/', mi_perfil, name='mi_perfil'),
    path('perfil/toggle-admin/', toggle_admin_mode, name='toggle_admin_mode'),
    path('perfil/guardar-app-password/', guardar_app_password, name='guardar_app_password'),
    path('perfil/test-email/', test_email_config, name='test_email_config'),

    # Mis eventos y certificados (para usuarios logueados)
    path('mis-eventos/', mis_eventos, name='mis_eventos'),
    path('mis-certificados/', mis_certificados, name='mis_certificados'),
]