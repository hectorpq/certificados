from django.db import models
from django.core.exceptions import ValidationError
from django.conf import settings

class Student(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='student_profile'
    )
    document_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['first_name', 'last_name']
        indexes = [
            models.Index(fields=['is_active']),
            models.Index(fields=['document_id']),
            models.Index(fields=['email']),
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.document_id})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def link_to_user(self):
        """Vincular automáticamente con un usuario si existe con el mismo email"""
        from users.models import User
        try:
            user = User.objects.get(email=self.email)
            self.user = user
            self.save(update_fields=['user'])
            return True
        except User.DoesNotExist:
            return False