from rest_framework import viewsets
from api.serializers import EventSerializer, TranslationSerializer
from .models import Event, Translation


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer