<script>

export let title = "Tittel";
export let ingress = "Ingress";
export let date = "";
export let slug = "";
export let img = {
            src: "",
            alt: ""
        }
    

    $: time = new Date(date).toLocaleString("no-NO", {day:'numeric', month:'long', hour: 'numeric', minute:'numeric', year: 'numeric'});
  


</script>

<div class="container">
<p><small>Postet: {time}</small></p>
<img src={img.src} alt={img.alt}>
<h2>{title}</h2>
{@html ingress}
<p><a href="blogg/{slug}">Les mer</a></p>
</div>

<style>
    img {
        max-width: 100%;
    }
</style>
