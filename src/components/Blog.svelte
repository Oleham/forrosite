<script>
import { afterUpdate } from "svelte";



export let post = {
        title: "Tittel",
        ingress:"Ingress",
        body: "<p>Body Text</p>",
        img: {
            src: "",
            alt: ""
        }
    }

// Very Simple Markdown Parser(tm)
// Double enter for paragraph
// start new paragraph with "# " for h3
// Add picture with ![alt text](link to pic)
function parseMD(input) {
    let output = [];
    let paragraphs = input.split("\r\n\r\n")
    paragraphs.forEach(el => {
        
        if (el.startsWith("# ")) {
            output.push(el.replace("# ", "<h3>") + "</h3>")
        } else if (el.startsWith("![") && el.endsWith(")")) {
            output.push(el.replace("![", `<img alt="`).replace("](", `" src="`).replace(")", `"<br>`));
        } else {
            output.push("<p>" + el + "</p>");
        }
    });
    return output.join("\n")
}

afterUpdate(() => {
 post.body = parseMD(post.body);
})

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
