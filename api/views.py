from rest_framework import viewsets
from api.serializers import EventSerializer, PostSerializer, TabSerializer
from .models import Event, Post, Tab


class EventViewSet(viewsets.ModelViewSet):
    # Order by date, latest date first
    queryset = Event.objects.order_by('when').all()
    serializer_class = EventSerializer

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.order_by('-date').all()
    serializer_class = PostSerializer

class TabViewSet(viewsets.ModelViewSet):
    queryset = Tab.objects.all()
    serializer_class = TabSerializer