
<script>

    import { slide } from 'svelte/transition';

   export let tabs = [
       {
           id: 1,
           title: "Forro", 
            teaser: `<h2>Klar for dans?</h2>
        <p>Forro er en lett tilgjengelig og populær dans fra Brasil. Den har blitt meget populær i Europa i løpet av de seneste årene. I Norge har ikke dansen vært så populær ennå.</p>
        <p>Mer informasjon om Forro kommer på denne siden. Her kan du bli kjent med dansen og finne arrangementer her i Oslo.</p>
        <p>Denne siden er under konstruksjon.</p>`,
            cta: "Les mer om Forro her",
            text: `<p>Forro danses i par</p>
            <p>Det finnes flere festivaler rundt i Europa</p>
            <iframe width="400" height="250" src="https://www.youtube.com/embed/c33sqgUUJKg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
        },
        {
            id: 2,
            title: "Trinnene",
            teaser: `<h2>Nysgjerrig på trinnene?</h2>
        <p>Forro er en pardans med en sånn og sånn rytme.</p>
        <p>Trinnene er avslappede og med mindre hoftebevegelser enn f.eks. salsa.</p>`,
            cta: "Se trinnene",
            text: `<p>Her får du en rask oversikt over trinnene:</p>
            <iframe width="400" height="250" src="https://www.youtube.com/embed/vudZL4_uqLo" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
        },
        {
            id: 3,
            title: "Musikken",
            teaser: `<h2>Trekkspill!</h2>
    <p>Musikksjangeren Forro dreier seg stort sett om instrumentene trekkspill, tamburin og triangel.</p>
    <p>Her ser du noen kjente Forro-artister.</p>`,
            cta: "Hør musikken",
            text: `<p>Her kan du høre noe av musikken:</p>
            <iframe width="400" height="250" src="https://www.youtube.com/embed/a6a3gOYW2Is" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
        }
   ]

   // Start with first tab open
   let activeTab = 1;

   function showTab(id) {
        activeTab = id;
        expand = false;
   }

   let expand = false;

</script>

<div class="tab-wrap">
    {#each tabs as tab}
    <button class={tab.id === activeTab ? 'tab active' : 'tab'} on:click={() => { showTab(tab.id) }}>{tab.title}</button>
    {/each}
</div>

{#each tabs as tab}
    {#if activeTab === tab.id}
    <div class="box" id={tab.title} in:slide={{delay: 400, duration:500}} out:slide={{duration:500}}>
        {@html tab.teaser}
        {#if expand}
        <div transition:slide={{duration:500}} >{@html tab.text}
        <p><button class="btn" on:click={() => {expand=false;}}>Lukk</button></p>
        </div>
        {:else}
        <p transition:slide><button class="btn" on:click={() => {expand=true;}}>{tab.cta}</button></p>
        {/if}
    </div>
    {/if}
{/each}


<style>

    .tab {
        font-family: inherit;
        font-size: 1rem;
        border: none;
        font-weight: 600;
        background-color: rgb(136, 135, 135);
        padding: 15px;
        cursor: pointer;
    }

    .tab.active {
        background-color:lightgrey;
        transition: 0.3s;
    }

    .tab-wrap {
        display: flex;
        border: solid black;
        border-bottom: none;
        background-color: rgb(136, 135, 135);
    }


    .box {
        background-color: lightgrey;
        padding: 10px;
        border: solid black;
        border-top: none;
        color: black;
        transition: 0,3s;
    }


    .btn {
        background-color: black;
        border: none;
        padding: 10px;
        font-family: inherit;
        color:lightgrey;
        font-size: 1rem;
    }

    @media only screen and (max-width: 400px) {

        .tab {
            background-color: lightgrey;
        }

        .tab-wrap {
            flex-direction: column;
            border-bottom: 2px solid black;
        }

        .tab.active {
            display: block;
            border-left: 15px solid rgb(136, 135, 135);
            
        }
    }
</style>


