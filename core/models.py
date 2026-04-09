from django.db import models


class AnonymousAccess(models.Model):
    """
    Registra accesos anónimos al sistema para limitar a 30 personas.
    """
    session_key = models.CharField(max_length=100, unique=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    accessed_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-accessed_at']
        verbose_name = 'Acceso Anónimo'
        verbose_name_plural = 'Accesos Anónimos'

    def __str__(self):
        return f"Acceso {self.session_key[:10]}... - {self.accessed_at}"

    @classmethod
    def get_active_count(cls):
        """Obtiene el número de accesos anónimos activos"""
        return cls.objects.filter(is_active=True).count()

    @classmethod
    def can_access(cls, session_key):
        """Verifica si un session_key ya tiene acceso o si hay cupo disponible"""
        # Si ya existe este session_key, permitir acceso
        if cls.objects.filter(session_key=session_key, is_active=True).exists():
            return True
        # Si hay menos de 30, permitir
        return cls.get_active_count() < 30

    @classmethod
    def register_access(cls, session_key, ip_address=None):
        """Registra un nuevo acceso anónimo"""
        if not cls.objects.filter(session_key=session_key).exists():
            cls.objects.create(session_key=session_key, ip_address=ip_address)
