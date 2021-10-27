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
<h1>Les bloggen:</h1>
<img src={post.img.src} alt={post.img.alt}>
<h2>{post.title}</h2>
<p><strong>{post.ingress}</strong></p>
{@html post.body}
</div>

<style>
    .container {
        margin: 30px 0px 30px 0px;
        border-top: 2px solid var(--main-yellow);
        padding: 20px 0px 20px 0px;
    }

    img {
        max-width: 100%;
    }
</style>
