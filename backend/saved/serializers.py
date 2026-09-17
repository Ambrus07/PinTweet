from rest_framework import serializers

from .models import SavedPost


class SavedPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedPost
        fields = "__all__"