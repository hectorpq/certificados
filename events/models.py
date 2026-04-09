# events/models.py

import uuid
from django.db import models
from django.utils import timezone
from datetime import timedelta
from users.models import User
from students.models import Student
from instructors.models import Instructor


class EventCategory(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Event Categories'

    def __str__(self):
        return self.name


class Event(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('finished', 'Finished'),
        ('cancelled', 'Cancelled'),
    )

    id = models.BigAutoField(primary_key=True)

    category = models.ForeignKey(
        EventCategory,
        on_delete=models.SET_NULL,
        null=True,
        related_name='events'
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_events'
    )
    template = models.ForeignKey(
        'certificados.Template',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='events'
    )

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    event_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    duration_hours = models.IntegerField(null=True, blank=True)
    location = models.CharField(max_length=200, blank=True)
    
    instructor_name = models.CharField(max_length=100, blank=True)
    instructor_bio = models.TextField(blank=True)
    
    is_public = models.BooleanField(default=False)
    invitation_message = models.TextField(
        blank=True,
        default="Has sido invitado a participar en este evento. ¡Te esperamos!"
    )
    max_capacity = models.IntegerField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    is_active = models.BooleanField(default=True)

    # Template para certificados
    template_image = models.ImageField(upload_to='event_templates/', null=True, blank=True)
    name_x = models.IntegerField(default=200)
    name_y = models.IntegerField(default=150)
    name_font_size = models.IntegerField(default=24)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-event_date']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['event_date']),
        ]

    def __str__(self):
        return f"{self.name} ({self.event_date.strftime('%d/%m/%Y')})"

    def get_invitation_url(self, invitation):
        return f"http://localhost:5173/invitation/{invitation.token}"


class Invitation(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pendiente'),
        ('sent', 'Enviado'),
        ('accepted', 'Aceptado'),
        ('declined', 'Rechazado'),
        ('expired', 'Expirado'),
    )
    
    SENT_VIA_CHOICES = (
        ('email', 'Email'),
        ('whatsapp', 'WhatsApp'),
        ('both', 'Ambos'),
    )

    id = models.BigAutoField(primary_key=True)
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='invitations'
    )
    student_email = models.EmailField()
    student_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20, blank=True, default="")
    
    token = models.CharField(max_length=64, unique=True, editable=False)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    sent_via = models.CharField(max_length=20, choices=SENT_VIA_CHOICES, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
    
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invitations'
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['student_email']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.student_name} - {self.event.name} [{self.status}]"

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = str(uuid.uuid4()).replace('-', '')
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=48)
        super().save(*args, **kwargs)

    def is_expired(self):
        if self.status in ['accepted', 'declined']:
            return False
        return timezone.now() > self.expires_at

    def is_valid(self):
        return not self.is_expired() and self.status not in ['accepted', 'declined']

    def mark_as_sent(self, via='both'):
        self.status = 'sent'
        self.sent_via = via
        self.sent_at = timezone.now()
        self.save(update_fields=['status', 'sent_via', 'sent_at'])

    def mark_as_accepted(self, user=None):
        self.status = 'accepted'
        self.accepted_at = timezone.now()
        self.user = user
        self.save(update_fields=['status', 'accepted_at', 'user'])

    def mark_as_declined(self):
        self.status = 'declined'
        self.save(update_fields=['status'])

    def refresh_expiry(self):
        self.expires_at = timezone.now() + timedelta(hours=48)
        if self.status == 'expired':
            self.status = 'pending'
        self.save(update_fields=['expires_at', 'status'])

    @property
    def invitation_url(self):
        base_url = "http://localhost:5173"
        return f"{base_url}/invitation/{self.token}"


class EventInstructor(models.Model):
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='instructors'
    )
    instructor = models.ForeignKey(
        Instructor,
        on_delete=models.CASCADE,
        related_name='events'
    )
    role = models.CharField(max_length=50, default='principal')

    class Meta:
        unique_together = ('event', 'instructor')
        verbose_name = 'Event Instructor'
        verbose_name_plural = 'Event Instructors'

    def __str__(self):
        return f"{self.event.name} - {self.instructor.full_name} ({self.role})"


class Enrollment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pendiente'),
        ('confirmed', 'Confirmado'),
        ('attended', 'Asistió'),
    )

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    invitation = models.ForeignKey(
        Invitation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='enrollments'
    )
    
    enrolled_at = models.DateTimeField(auto_now_add=True)
    attendance = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='confirmed')
    grade = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ('student', 'event')
        ordering = ['enrolled_at']
        indexes = [
            models.Index(fields=['student', 'event']),
            models.Index(fields=['attendance']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        attendance_mark = "✓" if self.attendance else "✗"
        return f"{self.student.first_name} - {self.event.name} [{attendance_mark}]"