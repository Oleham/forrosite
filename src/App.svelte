<script>
	import Event from './Event.svelte';

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
	{#await data}
	<p>venter</p>
	{:then events}
		{#each events as event}
		<Event {...event}/>
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

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>