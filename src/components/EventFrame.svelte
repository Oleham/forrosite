<script>
    import Event from './Event.svelte'

    export let events = [
            {   
                title: "Tittel",
                where: "Address",
                when: "01.02.04 10:00",
                img: {
                    src: "image.jpeg",
                    alt: "Alternativ tekst"
                },
                description: "Ta med danseskoene og kom!",
                translations: [
                    {
                        lang: "en",
                        title: "Title",
                        description: "Bring your dancing shoes!!"
                    },
                    {
                        lang: "po",
                        title: "Título",
                        description: "Traga seus sapatos de dança!"
                    }
                ]
            }];

    
    function findUpcoming(array) {
        let today = new Date()
        return array.filter((el) => {
            return (today <= new Date(el.when))
        })
    };

    let upcoming = findUpcoming(events);

    // State for all upcoming events
    let showAll = false;

    function toggleUpcoming() {
        showAll = !showAll
    }

    function seeList() {
        list = true;
    }

    // List is the state for seeing the full event list.
    let list = false;

</script>

<h2>Se kommende arrangementer --></h2>

<div class="container">
    {#each upcoming as event, i}
        {#if i < 3 || showAll}
            <Event {event} />
        {/if}
    {/each}
    {#if showAll}
    <div class="more" on:click={toggleUpcoming}>-</div>
    {:else}
    <div class="more" on:click={toggleUpcoming}>+</div>
    {/if}
</div>

<div class="all" on:click={seeList}>(Se alle arrangementer)</div>

{#if list}
<div class="overlay">
    <div class="allwrapper">
        <h1>Alle arrangementer:</h1>
        <div class="allcontainer">
            {#each events as event}
                <Event {event}/>
            {/each}
        </div>
        <button on:click={() => {list = false;}}>Tilbake</button>
    </div>
</div>
{/if}


<style>
    .container {
        display: flex;
        align-content: center;
        justify-content: space-around;
        flex-wrap: wrap;
    }

    .overlay {
        position: fixed;
        width: 100%;
        height: 100%;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        overflow-y: auto;
        background-color:rgb(0,0,0);
        z-index: 1;
        transition: 0.3s;
    }

    .allcontainer {
        display: flex;
        flex-wrap:wrap;
        align-content: center;
        justify-content: space-between;
        width: 90%;
        height: 90%;
        z-index: 4;
        transition: 0.3s;
    }
    
    .allwrapper {
        padding: 30px;
        display: flex;
        flex-direction: column;
    }

    .allwrapper button {
        text-decoration: none;
        border: none;
        font-size: inherit;
        font-family: inherit;
        cursor: pointer;
    }

    .allwrapper button:hover {
        font-size: 1.5rem;
    }

    .all {
        color: rgba(255,255,255,0.5);
    }

    .all:hover {
        color: white;
        cursor: pointer; 
    }

    .more {
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        background-color: var(--background-card);
        font-size: 5rem;
        width: 200px;
        height: 200px;
        border-radius: 10px;
        margin: 20px 0px 20px 0px;
        padding: 20px;
    }

    .more:hover {
        translate: 0px -5px;
    }

</style>


