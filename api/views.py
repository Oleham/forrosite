from rest_framework import viewsets
from api.serializers import EventSerializer, PostSerializer
from .models import Event, Post


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer