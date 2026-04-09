from rest_framework.authentication import TokenAuthentication, BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
import jwt
import logging
import requests

logger = logging.getLogger(__name__)
User = get_user_model()

GOOGLE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
GOOGLE_CLIENT_ID = None  # Configurar desde settings

_cached_certs = None
_cached_certs_time = 0
CERT_CACHE_DURATION = 3600


def get_google_certs():
    """Obtiene y cachea los certificados públicos de Google"""
    global _cached_certs, _cached_certs_time
    import time
    
    now = time.time()
    if _cached_certs and (now - _cached_certs_time) < CERT_CACHE_DURATION:
        return _cached_certs
    
    try:
        response = requests.get(GOOGLE_CERTS_URL, timeout=10)
        response.raise_for_status()
        _cached_certs = response.json()
        _cached_certs_time = now
        logger.info("Certificados de Google actualizados")
        return _cached_certs
    except Exception as e:
        logger.error(f"Error obteniendo certificados de Google: {e}")
        if _cached_certs:
            return _cached_certs
        raise


def verify_google_token(token, client_id):
    """Verifica el token de Google contra los certificados públicos"""
    try:
        certs = get_google_certs()
        
        for kid, cert_pem in certs.items():
            try:
                decoded = jwt.decode(
                    token,
                    cert_pem,
                    algorithms=['RS256'],
                    audience=client_id,
                    options={"verify_iss": "https://accounts.google.com"}
                )
                return decoded
            except jwt.exceptions.InvalidSignatureError:
                continue
            except jwt.PyJWTError:
                continue
        
        logger.warning("Ningún certificado válido para el token")
        return None
    except Exception as e:
        logger.error(f"Error verificando token: {e}")
        return None


class CustomTokenAuthentication(BaseAuthentication):
    """
    Autenticacion personalizada que soporta:
    - Bearer <jwt> (Google JWT o Token cualquiera)
    """
    
    def authenticate(self, request):
        auth = request.META.get('HTTP_AUTHORIZATION', '').split()
        
        if not auth or len(auth) != 2:
            return None
        
        auth_type, token = auth[0], auth[1]
        
        # Bearer JWT/Token
        if auth_type.lower() == 'bearer':
            return self._authenticate_jwt(token)
        
        # Token Django
        elif auth_type.lower() == 'token':
            return self._authenticate_token(token)
        
        return None
    
    def _authenticate_token(self, token):
        """Autentica usando Token de Django REST Framework"""
        from rest_framework.authtoken.models import Token
        try:
            token_obj = Token.objects.get(key=token)
            return (token_obj.user, token)
        except Token.DoesNotExist:
            logger.warning(f"Token no encontrado: {token[:10]}...")
            return None
    
    def _authenticate_jwt(self, token):
        """Autentica usando JWT de Google con verificación de firma"""
        from django.conf import settings
        client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)
        
        if not client_id:
            logger.warning("GOOGLE_CLIENT_ID no configurado, usando validación básica")
            return self._authenticate_jwt_basic(token)
        
        try:
            decoded = verify_google_token(token, client_id)
            
            if not decoded:
                return self._authenticate_jwt_basic(token)
            
            email = decoded.get('email') or decoded.get('sub')
            
            if not email:
                logger.error('Email no encontrado en JWT verificado')
                return None
            
            full_name = decoded.get('name', '') or ''
            user, created = User.objects.get_or_create(
                email=email,
                defaults={'full_name': full_name}
            )
            
            if user.full_name != full_name:
                user.full_name = full_name
                user.save(update_fields=['full_name'])
            
            logger.info(f"Usuario autenticado con JWT verificado: {email}")
            return (user, token)
            
        except Exception as e:
            logger.error(f"Error autenticando JWT: {str(e)}")
            return self._authenticate_jwt_basic(token)
    
    def _authenticate_jwt_basic(self, token):
        """Autenticación JWT básica (sin verificación de firma) - solo para desarrollo"""
        from django.conf import settings
        
        if not settings.DEBUG:
            logger.warning("Autenticación JWT básica bloqueada en producción")
            return None
        
        try:
            decoded = jwt.decode(token, options={"verify_signature": False})
            
            email = decoded.get('email') or decoded.get('sub')
            
            if not email:
                logger.error('Email o sub no encontrado en JWT')
                return None
            
            full_name = decoded.get('name', '') or ''
            user, created = User.objects.get_or_create(
                email=email,
                defaults={'full_name': full_name}
            )
            
            if user.full_name != full_name:
                user.full_name = full_name
                user.save(update_fields=['full_name'])
            
            logger.warning(f"Usuario autenticado con JWT sin verificar (DEBUG): {email}")
            return (user, token)
            
        except jwt.InvalidTokenError as e:
            logger.warning(f"JWT inválido: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Error autenticando JWT: {str(e)}")
            return None

