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
                fbevent: "",
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

    let numberOfUpcoming = 0;
    // Checks whether the event is in the past or future.
    function findUpcoming(array) {
        let today = new Date()
        return array.map((el) => {
            if (today <= new Date(el.when)) {
                numberOfUpcoming++
                el.upcoming = true;
                return el;              
            } else {
                el.upcoming = false;
                return el;
            }
        })
    };

    let sortedEvents = findUpcoming(events);

    // Sort the array so that the upcoming events are first.
    sortedEvents.sort((a,b) => {
        if (a.upcoming && b.upcoming) {
            return 0;
        }
        if (a.upcoming && !b.upcoming) {
            return -1;
        }
        if (!a.upcoming && b.upcoming) {
            return 1;
        }

    })

    let showAll = false;

    let items = numberOfUpcoming;



</script>


<h2>Se {showAll ? "alle" : "kommende"} arrangementer --></h2>

<div class="controls">
    <input type="checkbox" id="allcheck" bind:checked={showAll}><label for="allcheck">(se alle)</label>
    {#if showAll}
    <input type="range" id="itemsrange" bind:value={items} max={sortedEvents.length}><label for="itemsrange">Viser {items} av {sortedEvents.length} arrangementer.</label>
    {/if}
</div>

<div class="container">
    {#each sortedEvents as event, i (event.id)}
        {#if (showAll && i < items) || (!showAll && event.upcoming === true)}
            <Event {event} />
        {/if}
    {/each}
</div>

<style>
    .container {
        display: flex;
        align-content: center;
        justify-content: space-around;
        flex-wrap: wrap;
    }

    .controls label {
        margin: 0px 10px 0px 10px;
    }

    #allcheck {
        width: 20px;
        height: 20px;
    }

</style>


