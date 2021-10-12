<script>
	export let name;

	let visible = false;

	let text = "Nei"

	const tada = () => {
		visible != visible;
		text = "Jo";
		window.location = "http://localhost:8000/om"
	}

	let current = window.location

	async function getEvents() {
		const response = await fetch("api/events")
		return response.json()
	}

	let data = getEvents();

</script>

<main>
	{#if current == "http://localhost:8000/om"}
	<p>Dette er om-siden!</p>
	{/if}
	<h1>Hello {name}!</h1>
	<p>Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p>
	<p>Der finner du mye lurt</p>
	<button on:click={tada}>Klikk her</button>
	
	{#await data}
	<p>venter</p>
	{:then events}
		{#each events as event}
		<p>{event.title}</p>
		{/each}
	{:catch error}
	<p>{error.message}</p>
	{/await}

	<p>{current}</p>

</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: rgb(64, 31, 211);
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>