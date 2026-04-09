"""
Permisos personalizados para el sistema de certificados
"""
from functools import wraps
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse


class AnonymousAccessLimit(permissions.BasePermission):
    """
    Permiso que permite acceso anónimo con límite de 30 personas.
    Si el usuario está autenticado, permite siempre.
    """
    def has_permission(self, request, view):
        # Usuarios autenticados siempre tienen acceso
        if request.user and request.user.is_authenticated:
            return True

        # Para usuarios anónimos, verificar límite
        from core.models import AnonymousAccess
        session_key = request.session.session_key
        if not session_key:
            request.session.create()
            session_key = request.session.session_key

        return AnonymousAccess.can_access(session_key)


class AllowAnyWithLimit(permissions.BasePermission):
    """
    Permiso que permite acceso a cualquiera (autenticado o no),
    pero registra y limita a 30 usuarios anónimos.
    """
    message = 'Se ha alcanzado el límite de 30 usuarios. Inicia sesión para continuar.'

    def has_permission(self, request, view):
        from core.models import AnonymousAccess

        # Si está autenticado, permitir siempre sin registrar
        if request.user and request.user.is_authenticated:
            return True

        # Para usuarios anónimos, verificar límite y registrar
        session_key = request.session.session_key
        if not session_key:
            request.session.create()
            session_key = request.session.session_key

        # Verificar si ya tiene acceso o hay cupo
        if AnonymousAccess.can_access(session_key):
            # Registrar el acceso si es nuevo
            AnonymousAccess.register_access(
                session_key=session_key,
                ip_address=get_client_ip(request)
            )
            return True

        # Límite alcanzado
        return False


def anonymous_access_limit(view_func):
    """
    Decorador para vistas que limita acceso anónimo a 30 personas.
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        # Usuarios autenticados siempre tienen acceso
        if request.user and request.user.is_authenticated:
            return view_func(request, *args, **kwargs)

        # Asegurar que existe sesión
        if not request.session.session_key:
            request.session.create()

        from core.models import AnonymousAccess
        session_key = request.session.session_key

        # Verificar si ya tiene acceso
        if AnonymousAccess.can_access(session_key):
            # Registrar el acceso si es nuevo
            AnonymousAccess.register_access(
                session_key=session_key,
                ip_address=get_client_ip(request)
            )
            return view_func(request, *args, **kwargs)

        # Si no hay cupo, denegar
        if hasattr(request, 'is_api_request') or request.path.startswith('/api/'):
            return Response(
                {
                    'error': 'Límite de accesos alcanzado',
                    'message': 'Se ha alcanzado el límite de 30 usuarios anónimos. Por favor, inicia sesión para continuar.'
                },
                status=status.HTTP_403_FORBIDDEN
            )
        return JsonResponse(
            {
                'error': 'Límite de accesos alcanzado',
                'message': 'Se ha alcanzado el límite de 30 usuarios anónimos. Por favor, inicia sesión para continuar.'
            },
            status=403
        )

    return _wrapped_view


def get_client_ip(request):
    """Obtiene la IP del cliente"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


class IsAdminUser(permissions.BasePermission):
    """
    Permiso que solo permite acceso a usuarios admin.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permite lectura a todos, pero solo admin puede modificar.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and request.user.role == 'admin'
