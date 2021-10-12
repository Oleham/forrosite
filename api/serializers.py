from rest_framework import  serializers
from .models import Event, IMG

# Serializers define the API representation.
class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'
        depth = 2

class IMGSerializer(serializers.ModelSerializer):
    class Meta:
        model = IMG
        fields = '__all__'