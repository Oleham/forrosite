
<script>

    // Start with tab Forro open
    let activeTab = "Forro";

   let tabs = [
       {
           id: "Forro", 
            text: `<h2>Klar for dans?</h2>
        <p>Forro er en lett tilgjengelig og populær dans fra Brasil. Den har blitt meget populær i Europa i løpet av de seneste årene. I Norge har ikke dansen vært så populær ennå.</p>
        <p>Mer informasjon om Forro kommer på denne siden. Her kan du bli kjent med dansen og finne arrangementer her i Oslo.</p>`,
            cta: "Les mer om Forro her"
        },
        {
            id: "Trinnene",
            text: `<h2>Trinnene?</h2>
        <p>Forro er en pardans med en sånn og sånn rytme.</p>
        <p>Trinnene er avslappede og med mindre hoftebevegelser enn f.eks. salsa.</p>`,
            cta: "Se trinnene"
        },
        {
            id: "Musikken",
            text: `<h2>Trekkspill!</h2>
    <p>Musikksjangeren Forro dreier seg stort sett om instrumentene trekkspill, tamburin og triangel.</p>
    <p>Her ser du noen kjente Forro-artister.</p>`,
            cta: "Hør musikken"
        }
   ]

   function showTab(id) {
        activeTab = id;
   }

</script>

<div class="tab-wrap">
    {#each tabs as tab}
    <button class={tab.id === activeTab ? 'tab active' : 'tab'} on:click={() => { showTab(tab.id) }}>{tab.id}</button>
    {/each}
</div>


{#each tabs as tab}
    {#if activeTab === tab.id}
    <div class="box" id={tab.id}>
        {@html tab.text}
        <p><button class="btn">{tab.cta}</button></p>
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
    }

    .tab-wrap {
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
    }


    .btn {
        background-color: black;
        border: none;
        padding: 10px;
        font-family: inherit;
        color:lightgrey;
        font-size: 1rem;
    }
</style>


