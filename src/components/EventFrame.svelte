<script>
    import Event from './Event.svelte'
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    export let events = [
            { 
                lang: "no",
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

        // We only want to see the three first elements here.
        // This needs to be refines
        let new_events = events.slice(-3)

        function moreClicked() {
            dispatch("more");
        }


</script>

<h2>Se de neste arrangementene --></h2>

<div class="container">
    {#each new_events as event}
    <Event {event} />
    {/each}
    <div class="more" on:click={moreClicked}>+</div>
</div>

<style>
    .container {
        display: flex;
        align-content: center;
        justify-content: space-between;
    }

    .more {
        display: flex;
        align-content: center;
        justify-content: center;
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

    @media only screen and (max-width: 1000px) {
        .container {
          flex-direction: column;
        }
    }

</style>


