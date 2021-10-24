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
    }

    button {
        background-color: inherit;
        font-size: inherit;
        border: none;
        border-bottom: 1px dotted black;
        max-width: 60px;
        margin: 0px 2px 0px 2px;
    }

    button:hover {
        translate: 0px -4px;
        transition: 0.5s;
    }



</style>