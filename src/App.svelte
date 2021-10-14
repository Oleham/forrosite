<script>
	import EventFrame from './components/EventFrame.svelte';

	let current = window.location

	async function getEvents() {
		const response = await fetch("api/events")
		return response.json()
	}

	let data = getEvents();

</script>

<h2>Se de neste arrangementene:</h2>

<EventFrame />

<!-- {#await data}
<p>venter</p>
{:then events}
<EventFrame {...events}/>
{:catch error}
<p>{error.message}</p>
{/await} -->

<p>{current}</p>

<style>

</style>