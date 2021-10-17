<script>
    import { fade } from 'svelte/transition';
    import Language from './Language.svelte';


    export let event;

    let { title, where, when, img, description } = event;

    let translations = event.translations;


    let overlay = false;
    function overlayOn() {
        overlay = true;
    }

    function overlayOff() {
        overlay = false;
    }


    function changeLang(e) {
        title = e.detail.title
        description = e.detail.description
    }

    function revertLang() {
        title = event.title
        description = event.description
    }

</script>


<div class="card" 
    class:selected={overlay} 
    on:click={overlayOn}
>
    {#if overlay}
    <div class="lang-menu">
    <Language {translations} on:changeLang={changeLang} on:revertLang={revertLang}/>
    </div>
    {/if}
    <h3>{title}</h3>
    <div class="textbox">
        <p>🌎</p>
        <p>{where}</p>
        <p>🕔</p>
        <p>{when}</p>
    </div>

    {#if overlay}
    <p in:fade="{{delay:300}}">{description}</p>
    {/if}

    <div class="image-box">
        <img src={img.src} alt={img.alt}>
    </div>
</div>

<div class:active_overlay={overlay} on:click={overlayOff}></div>

<style>


.lang-menu {
    float:right;

}

.card.selected {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: clamp(200px, 50%, 80%);
    height: clamp(200px, 50%, 80%);
    margin:auto;
    padding: 40px;
    transition: 0.3s;
    background-color: rgb(218, 96, 191);
    z-index: 2;
    overflow-y: scroll;
}

.card {
    display: flex;
    align-content: center;
    justify-content: center;
    flex-direction: column;
    margin: 20px 0px 20px 0px;
    width: 200px;
    height: 200px;
    border-radius: 10px;
    padding: 20px;
    background-color: var(--background-card);
}

.card:hover {
    translate: 0px -5px;
}

.image-box {
    display: flex;
    align-content: center;
    justify-content: center;
    height: 100px;
    width: 180px;
    overflow:hidden;
    border-radius: 5px;
    opacity: 0.7;
}

.card.selected .image-box {
    height: 50%;
    width:unset;
    max-width: 600px;
    overflow:hidden;
    opacity: unset;
    margin: 20px;
}

.textbox {
    display:grid;
    grid-template-columns: 30px 100px;
    margin: 10px 0px 10px 0px;
}

h3 {
    margin-bottom: 2px;
}

p {
    margin: 2px;
}

.active_overlay {
    text-align: center;
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: rgba(209, 255, 5, 0.5);
    z-index: 1;
}

@media only screen and (max-width: 1000px) {
        .card.card.selected {
          width: 90%;
          height: 90%;
        }
    }

</style>