"""
Serializers for Certificate and Delivery APIs
"""
from rest_framework import serializers
from certificados.models import Certificate
from deliveries.models import DeliveryLog
from students.models import Student
from events.models import Event, Invitation


class StudentSimpleSerializer(serializers.ModelSerializer):
    """Simple student serializer (used in nested contexts)"""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = Student
        fields = ['id', 'full_name', 'email', 'phone']
        read_only_fields = ['id', 'full_name', 'email', 'phone']


class EventSimpleSerializer(serializers.ModelSerializer):
    """Simple event serializer (used in nested contexts)"""
    class Meta:
        model = Event
        fields = ['id', 'name', 'event_date', 'category']
        read_only_fields = fields


class DeliveryLogSerializer(serializers.ModelSerializer):
    """Serializer for delivery logs"""
    delivery_method_display = serializers.CharField(
        source='get_delivery_method_display',
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    is_successful = serializers.SerializerMethodField()
    is_failed = serializers.SerializerMethodField()
    is_pending = serializers.SerializerMethodField()
    
    class Meta:
        model = DeliveryLog
        fields = [
            'id', 'certificate', 'delivery_method', 'delivery_method_display',
            'recipient', 'status', 'status_display', 'error_message',
            'sent_at', 'updated_at', 'sent_by', 'is_successful', 'is_failed', 'is_pending'
        ]
        read_only_fields = ['id', 'sent_at', 'updated_at', 'is_successful', 'is_failed', 'is_pending']
    
    def get_is_successful(self, obj):
        return obj.is_successful
    
    def get_is_failed(self, obj):
        return obj.is_failed
    
    def get_is_pending(self, obj):
        return obj.is_pending


class CertificateListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for certificate lists"""
    student = StudentSimpleSerializer(read_only=True)
    event = EventSimpleSerializer(read_only=True)
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = Certificate
        fields = [
            'id', 'student', 'event', 'status', 'status_display',
            'verification_code', 'issued_at', 'expires_at', 'is_expired'
        ]
        read_only_fields = fields
    
    def get_is_expired(self, obj):
        return obj.is_expired()


class CertificateDetailSerializer(serializers.ModelSerializer):
    """Full serializer for certificate details"""
    student = StudentSimpleSerializer(read_only=True)
    event = EventSimpleSerializer(read_only=True)
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    delivery_history = DeliveryLogSerializer(
        source='get_delivery_history',
        many=True,
        read_only=True
    )
    last_delivery = serializers.SerializerMethodField()
    has_delivery_attempts = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = Certificate
        fields = [
            'id', 'student', 'event', 'template', 'status', 'status_display',
            'verification_code', 'pdf_url', 'issued_at', 'updated_at', 'expires_at',
            'generated_by', 'delivery_history', 'last_delivery', 'has_delivery_attempts',
            'is_expired'
        ]
        read_only_fields = fields
    
    def get_last_delivery(self, obj):
        last = obj.last_delivery_attempt
        if last:
            return DeliveryLogSerializer(last).data
        return None
    
    def get_has_delivery_attempts(self, obj):
        return obj.has_delivery_attempts()
    
    def get_is_expired(self, obj):
        return obj.is_expired()


class CertificateCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating certificates"""
    student_id = serializers.IntegerField(write_only=True)
    event_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Certificate
        fields = ['student_id', 'event_id', 'template']
    
    def create(self, validated_data):
        from students.models import Student
        from events.models import Event
        
        student = Student.objects.get(id=validated_data['student_id'])
        event = Event.objects.get(id=validated_data['event_id'])
        
        certificate, created = Certificate.objects.get_or_create(
            student=student,
            event=event,
            defaults={'status': 'pending'}
        )
        
        if not created:
            raise serializers.ValidationError(
                "Certificate already exists for this student and event"
            )
        
        return certificate


class CertificateGenerateSerializer(serializers.Serializer):
    """Serializer for generating certificates"""
    template_id = serializers.IntegerField(required=False, allow_null=True)
    
    def validate(self, data):
        # Validate in view context where we have the certificate instance
        return data


class CertificateDeliverSerializer(serializers.Serializer):
    """Serializer for delivering certificates"""
    method = serializers.ChoiceField(choices=['email', 'whatsapp', 'link'])
    recipient = serializers.CharField(required=False, allow_blank=True)
    
    def validate_method(self, value):
        if value not in ['email', 'whatsapp', 'link']:
            raise serializers.ValidationError(
                "Invalid delivery method. Choose from: email, whatsapp, link"
            )
        return value


# ─────────────────────────────────────────
# EVENT SERIALIZERS
# ─────────────────────────────────────────

class EventListSerializer(serializers.ModelSerializer):
    """Serializer for event list"""
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    invitations_count = serializers.SerializerMethodField()
    accepted_count = serializers.SerializerMethodField()
    pending_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id', 'name', 'description', 'event_date', 'end_date',
            'location', 'instructor_name', 'instructor_bio',
            'status', 'is_public', 'max_capacity',
            'invitations_count', 'accepted_count', 'pending_count',
            'created_by_name', 'created_at'
        ]
        read_only_fields = fields
    
    def get_invitations_count(self, obj):
        return obj.invitations.count()
    
    def get_accepted_count(self, obj):
        return obj.invitations.filter(status='accepted').count()
    
    def get_pending_count(self, obj):
        return obj.invitations.filter(status__in=['pending', 'sent']).count()


class EventDetailSerializer(serializers.ModelSerializer):
    """Full serializer for event details"""
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    invitations = serializers.SerializerMethodField()
    template_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id', 'name', 'description', 'event_date', 'end_date',
            'location', 'instructor_name', 'instructor_bio',
            'status', 'is_public', 'max_capacity', 'invitation_message',
            'category', 'category_name', 'template',
            'template_image', 'template_image_url',
            'name_x', 'name_y', 'name_font_size',
            'invitations', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_invitations(self, obj):
        return obj.invitations.count()
    
    def get_template_image_url(self, obj):
        if obj.template_image:
            return obj.template_image.url
        return None


class EventCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating events"""
    class Meta:
        model = Event
        fields = [
            'name', 'description', 'event_date', 'end_date',
            'location', 'instructor_name', 'instructor_bio',
            'is_public', 'invitation_message', 'max_capacity',
            'category', 'template'
        ]
    
    def create(self, validated_data):
        validated_data['status'] = 'draft'
        user = self.context['request'].user
        if user.is_authenticated:
            validated_data['created_by'] = user
        return super().create(validated_data)


class EventTemplateSerializer(serializers.ModelSerializer):
    """Serializer for updating event template settings"""
    class Meta:
        model = Event
        fields = ['template_image', 'name_x', 'name_y', 'name_font_size']
    
    def validate_template_image(self, value):
        if value:
            if not value.name.lower().endswith(('.jpg', '.jpeg', '.png')):
                raise serializers.ValidationError(
                    "La imagen debe ser JPG o PNG"
                )
            if value.size > 10 * 1024 * 1024:  # 10MB
                raise serializers.ValidationError(
                    "La imagen no puede ser mayor a 10MB"
                )
        return value


# ─────────────────────────────────────────
# INVITATION SERIALIZERS
# ─────────────────────────────────────────

class InvitationListSerializer(serializers.ModelSerializer):
    """Serializer for invitation list"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    sent_via_display = serializers.CharField(source='get_sent_via_display', read_only=True)
    is_expired = serializers.SerializerMethodField()
    invitation_url = serializers.CharField(read_only=True)
    time_until_expiry = serializers.SerializerMethodField()
    
    class Meta:
        model = Invitation
        fields = [
            'id', 'student_email', 'student_name', 'phone',
            'status', 'status_display', 'sent_via', 'sent_via_display',
            'invitation_url', 'is_expired', 'time_until_expiry',
            'created_at', 'sent_at', 'accepted_at', 'expires_at'
        ]
        read_only_fields = fields
    
    def get_is_expired(self, obj):
        return obj.is_expired()
    
    def get_time_until_expiry(self, obj):
        from django.utils import timezone
        if obj.is_expired():
            return "Expirado"
        remaining = obj.expires_at - timezone.now()
        hours = int(remaining.total_seconds() / 3600)
        minutes = int((remaining.total_seconds() % 3600) / 60)
        return f"{hours}h {minutes}m"


class InvitationCreateSerializer(serializers.Serializer):
    """Serializer for creating invitations from Excel"""
    file = serializers.FileField(required=True)
    
    def validate_file(self, value):
        if not value.name.endswith(('.xlsx', '.xls', '.csv')):
            raise serializers.ValidationError(
                "El archivo debe ser Excel (.xlsx, .xls) o CSV"
            )
        return value


class InvitationPublicSerializer(serializers.ModelSerializer):
    """Serializer for public invitation view"""
    event_name = serializers.CharField(source='event.name', read_only=True)
    event_date = serializers.DateTimeField(source='event.event_date', read_only=True)
    event_location = serializers.CharField(source='event.location', read_only=True)
    instructor_name = serializers.CharField(source='event.instructor_name', read_only=True)
    instructor_bio = serializers.CharField(source='event.instructor_bio', read_only=True)
    invitation_message = serializers.CharField(source='event.invitation_message', read_only=True)
    invitation_url = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    time_until_expiry = serializers.SerializerMethodField()
    already_accepted = serializers.SerializerMethodField()
    
    class Meta:
        model = Invitation
        fields = [
            'id', 'student_name', 'student_email',
            'event_name', 'event_date', 'event_location',
            'instructor_name', 'instructor_bio', 'invitation_message',
            'invitation_url',
            'status', 'is_expired', 'time_until_expiry', 'already_accepted'
        ]
        read_only_fields = fields
    
    def get_invitation_url(self, obj):
        return obj.event.get_invitation_url(obj)
    
    def get_is_expired(self, obj):
        return obj.is_expired()
    
    def get_time_until_expiry(self, obj):
        from django.utils import timezone
        if obj.is_expired():
            return "Expirado"
        remaining = obj.expires_at - timezone.now()
        hours = int(remaining.total_seconds() / 3600)
        minutes = int((remaining.total_seconds() % 3600) / 60)
        return f"{hours}h {minutes}m"
    
    def get_already_accepted(self, obj):
        return obj.status == 'accepted'


class AcceptInvitationSerializer(serializers.Serializer):
    """Serializer for accepting invitation"""
    first_name = serializers.CharField(max_length=100, required=False)
    last_name = serializers.CharField(max_length=100, required=False)
    user_token = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        invitation = self.context.get('invitation')
        if not invitation:
            raise serializers.ValidationError("Invitación no encontrada")
        
        if invitation.is_expired():
            raise serializers.ValidationError("Esta invitación ha expirado")
        
        if invitation.status == 'accepted':
            raise serializers.ValidationError("Esta invitación ya fue aceptada")
        
        if invitation.status == 'declined':
            raise serializers.ValidationError("Esta invitación fue rechazada")
        
        return data
