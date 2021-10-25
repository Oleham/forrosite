from rest_framework import routers
from django.urls import path, include
from .views import EventViewSet, PostViewSet, TabViewSet

# Routers provide an easy way of automatically determining the URL conf.
router = routers.DefaultRouter()
router.register(r'events', EventViewSet)
router.register(r'posts', PostViewSet)
router.register(r'tabs', TabViewSet)

# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.
urlpatterns = [
    path('', include(router.urls)),
]