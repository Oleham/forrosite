from rest_framework import viewsets
from api.serializers import EventSerializer
from .models import Event


# ViewSets define the view behavior.
class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer