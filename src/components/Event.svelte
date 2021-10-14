<script>
    import { fade } from 'svelte/transition';
    import Language from './Language.svelte';

    export let event;

    let { title, where, when, img, description } = event;

    let translations = event.translations;


    let overlay = false;
    function toggleOverlay() {
        overlay = !overlay;
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

<div class="container">
    <div class="card" 
        class:selected={overlay} 
        on:click={toggleOverlay}
    >
        <div class="textbox" transition:fade>

            <h3>{title}</h3>

            <div class="info-box">
                <div class="info-label">
                    <p>🌎</p>
                    <p>🕔</p>
                </div>

                <div class="info-text">
                    <p>{where}</p>
                    <p>{when}</p>
                </div>
            </div>

            <div class="description">
                <p>{description}</p>
            </div>
        </div>

        <div class="image-box">
            <img src={img.src} alt={img.alt}>
        </div>
    </div>

    <div class="lang-menu" class:selected={overlay}>
        <Language {translations} on:changeLang={changeLang} on:revertLang={revertLang}/>
    </div>
</div>
<div class:active_overlay={overlay} on:click={toggleOverlay}></div>


<style>
.container {
    display: flex;
    margin: 10px;
}

.lang-menu {
    padding: 20px 10px 10px 0px;
    margin:0px;
}

.lang-menu.selected {
    position: absolute;
    font-size: 3rem;
    top:10px;
    left:0px;
    justify-self: start;
    z-index: 2;
}

.card.selected {
    position: absolute;
    flex-direction: row-reverse;
    max-width: 1200px;
    height: 60%;
    width:unset;
    margin:auto;
    padding: 30px;
    transition: 0.3s;
    background-color: rgb(218, 96, 191);
    z-index: 2;
}

.card {
    display: flex;
    align-content: center;
    justify-content: center;
    flex-direction: column;
    width: 200px;
    height: 200px;
    border: 6px solid var(--main-yellow);
    border-radius: 10px;
    margin: 10px 0px 10px 0px;
    padding: 5px;
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
    height: unset;
    width:unset;
    max-width: 600px;
    overflow:hidden;
    opacity: unset;
    margin: 20px;
}

.textbox {
    flex-grow: 3;
    text-align: left;
}

h3 {
    margin-bottom: 2px;
}

p {
    margin: 1px;
}

.info-box {
    display: flex;
    justify-content:flex-start
}

.info-label {
    padding-right: 10px;
}

.description {
    display:none;
}

.selected .description {
    display:block;
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

</style>