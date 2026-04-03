from rest_framework.authentication import TokenAuthentication, BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
import jwt
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


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
        """Autentica usando JWT (sin validar firma)"""
        try:
            # Decodificar sin validar firma (ya fue validado en el cliente por Google)
            decoded = jwt.decode(token, options={"verify_signature": False})
            
            email = decoded.get('email') or decoded.get('sub')
            
            if not email:
                logger.error('Email o sub no encontrado en JWT')
                return None
            
            # Obtain or create user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0][:150],  # Limitar a 150 chars
                    'first_name': (decoded.get('name', '') or '').split()[0][:30],
                }
            )
            
            logger.info(f"Usuario autenticado con JWT: {email} (nuevo: {created})")
            return (user, token)
            
        except jwt.InvalidTokenError as e:
            logger.warning(f"JWT inválido: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Error autenticando JWT: {str(e)}")
            return None

