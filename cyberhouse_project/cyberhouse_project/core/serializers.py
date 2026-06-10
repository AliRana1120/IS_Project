from rest_framework import serializers
from .models import CustomUser, SecurityDocument, AccessLog, ROLE_SECURITY_LEVEL


class UserSerializer(serializers.ModelSerializer):
    security_label = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'role', 'security_clearance', 'security_label',
                  'department', 'last_login', 'last_login_ip', 'date_joined']

    def get_security_label(self, obj):
        return obj.get_security_label()


class AdminUserSerializer(serializers.ModelSerializer):
    """Admin can see all details including plain_password."""
    security_label = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'role', 'security_clearance', 'security_label',
                  'department', 'last_login', 'last_login_ip', 'date_joined',
                  'plain_password', 'is_active']

    def get_security_label(self, obj):
        return obj.get_security_label()


class UserCreateSerializer(serializers.Serializer):
    """For admin to create new users."""
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField(required=False, default='')
    first_name = serializers.CharField(max_length=150, required=False, default='')
    last_name = serializers.CharField(max_length=150, required=False, default='')
    password = serializers.CharField(min_length=8)
    role = serializers.ChoiceField(choices=['admin', 'analyst', 'viewer'])
    department = serializers.CharField(max_length=100, required=False, default='General')

    def validate_username(self, value):
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already exists.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        role = validated_data.get('role', 'viewer')
        user = CustomUser(
            **validated_data,
            security_clearance=ROLE_SECURITY_LEVEL.get(role, 0),
            plain_password=password,
        )
        user.set_password(password)
        user.save()
        return user


class ProfileUpdateSerializer(serializers.Serializer):
    """For users to update their own profile."""
    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    department = serializers.CharField(max_length=100, required=False)
    current_password = serializers.CharField(required=False)
    new_password = serializers.CharField(min_length=8, required=False)


class DocumentSerializer(serializers.ModelSerializer):
    security_label = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = SecurityDocument
        fields = ['id', 'title', 'content', 'security_level', 'security_label',
                  'created_by', 'created_by_name', 'created_at', 'category']

    def get_security_label(self, obj):
        return obj.get_security_label()

    def get_created_by_name(self, obj):
        return obj.created_by.username if obj.created_by else None


class AccessLogSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()

    class Meta:
        model = AccessLog
        fields = ['id', 'user', 'username', 'action', 'resource',
                  'timestamp', 'ip_address', 'details', 'success']

    def get_username(self, obj):
        return obj.user.username if obj.user else 'Anonymous'


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class DocumentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecurityDocument
        fields = ['title', 'content', 'security_level', 'category']
