from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def link_user_to_student(sender, instance, created, **kwargs):
    """
    Cuando se crea un usuario, intenta vincularlo con un Student existente
    que tenga el mismo email.
    """
    if created:
        from students.models import Student
        try:
            student = Student.objects.get(email=instance.email)
            student.user = instance
            student.save(update_fields=['user'])
        except Student.DoesNotExist:
            pass
