<script>
    import Post from './Post.svelte';
    import { fly } from 'svelte/transition';

    export let posts = [
        {
            title: "Title",
            ingress:"Text",
            img: {
                src: "media/event-images/plassholder.jpg",
                alt: "Folkefest med forro"
            }
        },
        {
            title: "Title",
            ingress:"Text",
            img: {
                src: "media/event-images/plassholder.jpg",
                alt: "Folkefest med forro"
            }
        } 
    ]

    let active = 0;
    let direction = "";

    function change(pil) {
        if (pil === "left") {
            direction = pil;
            if (active > 0) {
                active--;
            }
        } else if (pil === "right") {
            direction = pil;
            if (active < (posts.length - 1)) {
                active++;
            }
        }
    }
</script>

<h2>Siste om Forro i Oslo:</h2>
<div class="container">
    <div class="btn-box">
        {#if active > 0}
        <button 
        on:click={() => {change("left")}}
        transition:fly={{y: 100, delay: 300, duration:500 }}
        >
            ◀
        </button>
        {/if}
    </div>
    {#each posts as post, index}
    {#if active === index}
    <div class="post" in:fly={{ x:100, duration: 300 }}>
        <Post {...post} />
    </div>
    {/if}
    {/each}
    <div class="btn-box">
        {#if active < (posts.length -1 )}
        <button 
        on:click={() => {change("right")}}
        transition:fly={{y: 100, delay: 300, duration:500 }}
        >
            ▶
        </button>
        {/if}
    </div>
</div>

<style>
    h2 {
        border-bottom: 2px solid var(--main-yellow);
    }

    .container {
        display: flex;
        align-items: center;
        width: 100%;
    }

    .post {
        width: 60%;
        padding: 10%;
    }

    .btn-box {
        width: 10%;
        height: 100px;
    }

    button {
        background-color: lightgreen;
        box-shadow: 5px 5px 5px;
        border: none;
        width: 100%;
        height: 100%;


    }

    button:first-of-type:hover {
        transform: translateX(-10px);
    }

    button:last-of-type:hover {
        transform: translateX(10px);
    }
</style>