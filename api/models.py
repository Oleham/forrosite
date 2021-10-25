from django.db import models
import markdown

class IMG(models.Model):
    src = models.ImageField(upload_to="event-images")
    alt = models.CharField(max_length=200)

    def __str__(self):
        return self.src.name

# Event
class Event(models.Model):

    title = models.CharField(max_length=100)
    where = models.CharField(max_length=200)
    when = models.DateTimeField()
    description = models.TextField()
    fbevent = models.URLField(max_length=200, blank=True)
    img = models.OneToOneField(IMG, on_delete=models.CASCADE, default=1)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        self.description = markdown.markdown(self.description)
        super(Event, self).save(*args, **kwargs)

# Event Translation
class Translation(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="translations")
    lang = models.CharField(max_length=3)
    title = models.CharField(max_length=200)
    description = models.TextField()

    def __str__(self):
        return f"{self.lang} translation for {self.event.title}"

# Blog post
class Post(models.Model):
    title = models.CharField(max_length=200)
    ingress = models.TextField()
    body = models.TextField()
    img = models.OneToOneField(IMG, on_delete=models.CASCADE, default=1)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        self.body = markdown.markdown(self.body)
        super(Post, self).save(*args, **kwargs)

# Tabs of the Introbox
class Tab(models.Model):
    title = models.CharField(max_length=100)
    teaser = models.TextField(max_length=300)
    cta = models.CharField(max_length=100)
    text = models.TextField()

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        self.text = markdown.markdown(self.text)
        super(Tab, self).save(*args, **kwargs)