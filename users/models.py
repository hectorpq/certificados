from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UserManager(BaseUserManager):
    def create_user(self, email, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError("El usuario debe tener email")

        email = self.normalize_email(email)
        user = self.model(email=email, full_name=full_name, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_staff', True)

        return self.create_user(email, full_name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('editor', 'Editor'),
        ('student', 'Student'),  # Nuevo rol para estudiantes
    )

    id = models.BigAutoField(primary_key=True)
    full_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')

    # Campo para activar/desactivar modo admin (solo cuando role=admin)
    admin_mode_enabled = models.BooleanField(default=False)
    email_app_password = models.CharField(max_length=100, blank=True, default='')

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)  # necesario para admin

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    def __str__(self):
        role_display = dict(self.ROLE_CHOICES).get(self.role, self.role)
        status = "✓" if self.is_active else "✗"
        admin_mode = " [ADMIN]" if self.is_admin_mode else ""
        return f"{self.full_name} ({role_display}) [{status}]{admin_mode}"

    @property
    def is_admin(self):
        """Verifica si el usuario tiene rol admin"""
        return self.role == 'admin'

    @property
    def is_admin_mode(self):
        """Verifica si el usuario está en modo admin activo"""
        return self.is_admin and self.admin_mode_enabled

    @property
    def can_create_events(self):
        """Puede crear eventos solo si está en modo admin"""
        return self.is_admin_mode

    @property
    def can_create_templates(self):
        """Puede crear templates solo si está en modo admin"""
        return self.is_admin_mode

    @property
    def can_import_students(self):
        """Puede importar estudiantes solo si está en modo admin"""
        return self.is_admin_mode

    def toggle_admin_mode(self):
        """Activa/desactiva el modo admin (solo si es admin)"""
        if self.is_admin:
            self.admin_mode_enabled = not self.admin_mode_enabled
            self.save(update_fields=['admin_mode_enabled'])
            return self.admin_mode_enabled
        return False