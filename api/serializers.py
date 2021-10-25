from rest_framework import  serializers
from .models import Event, IMG, Translation, Post, Tab

class TranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Translation
        fields = '__all__'


class EventSerializer(serializers.ModelSerializer):

    translations = TranslationSerializer(many=True)

    class Meta:
        model = Event
        fields = ['id', 'title', 'when', 'where', 'fbevent', 'description', 'img', 'translations']
        depth = 2

class IMGSerializer(serializers.ModelSerializer):
    class Meta:
        model = IMG
        fields = '__all__'

class PostSerializer(serializers.ModelSerializer):

    class Meta:
        model = Post
        fields = '__all__'
        depth = 2

class TabSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tab
        fields = '__all__'

