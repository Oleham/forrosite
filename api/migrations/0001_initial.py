# Generated by Django 3.2.8 on 2021-10-11 13:22

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='IMG',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('src', models.ImageField(upload_to='')),
                ('alt', models.TextField(max_length=200)),
            ],
        ),
        migrations.CreateModel(
            name='Event',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=100)),
                ('where', models.CharField(max_length=200)),
                ('when', models.DateTimeField()),
                ('img', models.OneToOneField(default=1, on_delete=django.db.models.deletion.CASCADE, to='api.img')),
            ],
        ),
    ]
