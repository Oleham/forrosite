<script>
    import Event from './Event.svelte'

    export let events = [
            { 
                default: {
                    lang: "no",
                    title: "Tittel",
                    where: "Storgagta 20",
                    when: "01.02.04 10:00",
                    img: {
                        src: "media/event-images/mars.jpeg",
                        alt: "Alternativ tekst"
                    },
                    description: "Ta med danseskoene og kom!"
                },
                translations: [
                    {
                        lang: "en",
                        title: "Title",
                        description: "Bring your dancing shoes!!"
                    },
                    {
                        lang: "po",
                        title: "Titelau",
                        description: "Piede danso vamos!!"
                    }
                ]
            },
            { 
                default: {
                    lang: "no",
                    title: "Dansefest",
                    where: "Rådhusveien 20",
                    when: "01.02.04 10:00",
                    img: {
                        src: "media/event-images/mars.jpeg",
                        alt: "Alternativ tekst"
                    },
                    description: "Dette blir moro!"
                },
                translations: [
                    {
                        lang: "en",
                        title: "Title",
                        description: "This'll be fun!!"
                    },
                ]
            },
            { 
                default: {
                    lang: "no",
                    title: "Tittel",
                    where: "Haldenveien 20",
                    when: "01.02.04 10:00",
                    img: {
                        src: "media/event-images/mars.jpeg",
                        alt: "Alternativ tekst"
                    },
                    description: "Dette blir moro!"
                }
            }
    ]
</script>

<div class="container">
    {#each events as event}
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


