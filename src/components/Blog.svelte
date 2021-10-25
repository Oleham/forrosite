<script>

export let post = {
        title: "Tittel",
        ingress:"Ingress",
        body: "<p>Body Text</p>",
        img: {
            src: "",
            alt: ""
        }
    }

</script>

<div class="container">
<img src={post.img.src} alt={post.img.alt}>
<h1>{post.title}</h1>
<p><strong>{post.ingress}</strong></p>
{@html post.body}
</div>

<style>
    .container {
        margin: 30px 0px 30px 0px;
        border-top: 2px solid var(--main-yellow);
        border-bottom: 2px solid var(--main-yellow);
        padding: 20px 0px 20px 0px;
    }
</style>
