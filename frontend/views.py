from django.shortcuts import render
from api.models import Post

def index(request):

    return render(request, 'frontend/index.html')

def about(request):

    return render(request, 'frontend/about.html')

def single_blog(request, id):

    posts = Post.objects.filter(id=id).first()

    return render(request, "frontend/blog.html", {"post": posts, "single":True})

def all_blog(request):

    posts = Post.objects.all()

    return render(request, "frontend/blog.html", {"posts": posts})

