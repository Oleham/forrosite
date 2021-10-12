from django.db import models
from django.db.models.base import Model


class IMG(models.Model):
    src = models.ImageField()
    alt = models.TextField(max_length=200)

    def __str__(self):
        return self.src

# The events
class Event(models.Model):

    title = models.CharField(max_length=100)
    where = models.CharField(max_length=200)
    when = models.DateTimeField()
    img = models.OneToOneField(IMG, on_delete=models.CASCADE, default=1)

    def __str__(self):
        return self.title
