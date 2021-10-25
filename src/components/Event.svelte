<script>
    import { fade } from 'svelte/transition';
    import Language from './Language.svelte';
    import Map from './Map.svelte';


    export let event;

    let { title, where, when, img, description, fbevent } = event;

    when = new Date(when).toLocaleString("no-NO", {day:'numeric', month:'long', hour: 'numeric', minute:'numeric'});

    let translations = event.translations;

    let overlay = false;

    function changeLang(e) {
        title = e.detail.title
        description = e.detail.description
    }

    function revertLang() {
        title = event.title
        description = event.description
    }

    let map = false;
    function toggleMap() {
        map = !map;
    }

    console.log(fbevent)

</script>

<div class:overlay class="wrapper" on:click={() => {overlay = true;}}>
    {#if overlay}
    <div class="exit-btn" on:click|stopPropagation={()=> {overlay = false;}}>❌ LUKK</div>
    {/if}
    <div class="card" 
        class:selected={overlay}
    >
        <div class="card-header">
            {#if overlay}
            <div class="lang-menu">
                <Language {translations} on:changeLang={changeLang} on:revertLang={revertLang}/>
            </div>
            {/if}
            <h3>{title}</h3>
            <div class="infobox">
                <p>🌎</p>
                <p>{where}</p>
                <p>🕔</p>
                <p>{when}</p>
            </div>
            {#if overlay}
            <button class="btn" on:click|stopPropagation={toggleMap}>Onde?</button>
            <div style="display: {map ? 'block' : 'none'};">
                <Map adress={where} />
            </div>
            {/if}
        </div>
        
        {#if overlay}
        <div class="textbox" in:fade={{delay:300}}>
            <h4>Info:</h4>
            <p>{@html description}</p>
            {#if fbevent}
            <p><strong><a href={fbevent}>>>> Facebook</a></strong></p>
            {/if}
        </div>
        {/if}

        <div class="image-box">
            <img src={img.src} alt={img.alt}>
        </div>
    </div>
</div>


<style>

.card {
    display: flex;
    align-content: center;
    justify-content: center;
    flex-direction: column;
    margin: 20px 20px 20px 20px;
    width: 200px;
    height: 200px;
    border-radius: 10px;
    padding: 20px;
    background-color: var(--background-card);
}

.card:hover {
    translate: 0px -5px;
}

.card.selected {
    flex-direction: row;
    align-content: space-between;
    justify-content: space-between;
    max-width: 1200px;
    max-height: 80%;
    width: clamp(200px, 80%, 100%);
    height: clamp(200px, 50%, 100%);
    margin:auto;
    margin-top: 10%;
    overflow-y: auto;
    padding: 40px;
    transition: 0.3s;
    background-color: rgb(218, 96, 191);
    z-index: 2;
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
    width:unset;
    height: 200px;
    max-width: 300px;
    overflow:hidden;
    opacity: unset;
}

.infobox {
    display:grid;
    grid-template-columns: 30px 100px;
    margin: 10px 0px 10px 0px;
}

p {
    margin: 2px;
}

.textbox {
    padding: 0px 10px 0px 10px;
    margin: 0px 10px 0px 10px;
    border-left: 1px dotted black;
    border-right: 1px dotted black;
}

.overlay {
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: rgba(209, 255, 5, 0.5);
    z-index: 1;
    transition: 0.3s;
}

.btn {
    background-color: black;
    border: none;
    padding: 10px;
    font-family: inherit;
    color:lightgrey;
    font-size: 1rem;
}

.exit-btn {
    position: relative;
    top: 20;
    right: -20;
    font-size: 3rem;
    z-index: 2;
}

@media only screen and (max-width: 1000px) {
        .card.selected {
          flex-direction: column;
          height: 80%;
          max-width: 90%;
        }

        .card.selected .textbox{
            border:unset;
            padding: 10px 0px 10px 0px;
            margin: 10px 0px 10px 0px;
            border-top: 1px dotted black;
            border-bottom: 1px dotted black;
        }
    }

</style>