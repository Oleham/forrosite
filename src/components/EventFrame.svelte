<script>
    import Event from './Event.svelte'

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
</script>

<div class="container">
    {#each new_events as event}
    <Event {event} />
    {/each}
    <div class="more">+</div>
</div>

<style>
    .container {
        display: flex;
        align-content: center;
        justify-content: center;
    }

    .more {
        display: flex;
        color: var(--main-yellow);
        font-size: 5rem;
        text-align: center;
        text-justify: center;
        align-content: center;
        justify-content: center;
        width: 200px;
        height: 200px;
        border: 6px solid var(--main-yellow);
        border-radius: 10px;
        margin: 20px 0px 10px 0px;
        padding: 5px;
    }

    .more:hover {
        translate: 0px -5px;
    }

</style>


