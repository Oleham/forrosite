from django.db import models

class IMG(models.Model):
    src = models.ImageField(upload_to="event-images")
    alt = models.CharField(max_length=200)

    def __str__(self):
        return self.src.name

# The events
class Event(models.Model):

    title = models.CharField(max_length=100)
    where = models.CharField(max_length=200)
    when = models.DateTimeField()
    description = models.TextField()
    img = models.OneToOneField(IMG, on_delete=models.CASCADE, default=1)

    def __str__(self):
        return self.title

class Translation(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="translations")
    lang = models.CharField(max_length=3)
    title = models.CharField(max_length=200)
    description = models.TextField()

    def __str__(self):
        return f"{self.lang} translation for {self.event.title}"

