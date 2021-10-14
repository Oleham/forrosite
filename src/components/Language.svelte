<script>
    import { createEventDispatcher } from 'svelte';
    export let translations = []

    const dispatch = createEventDispatcher();

    function changeLang(text) {
        dispatch("changeLang", text)
    }

    function revertLang() {
        dispatch("revertLang", {})
    }

</script>

<div class="container">
    {#if translations.length != 0}
    {#each translations as trans}
    <button on:click={changeLang(trans)}>{trans.lang}</button>
    {/each}
    <button on:click={revertLang} style="color: red;">X</button>
    {:else}
    <button style="opacity:0;">X</button>
    {/if}
</div>

<style>
    .container {
        display:flex;
        flex-direction: column;
    }

    button {
        background-color: var(--main-yellow);
        font-size: inherit;
        border:none;
        border-bottom: 2px solid black;
        border-right: 2px solid black;
        border-top: 2px solid black;
        margin: 0px 0px 4px 0px;
    }

    button:hover {
        translate: 4px 0px;
        transition: 0.5s;
    }
</style>