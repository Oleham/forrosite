<script>
	import IntroBox from './components/IntroBox.svelte'
	import EventFrame from './components/EventFrame.svelte';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

	let current = window.location

	async function getEvents() {
		const response = await fetch("api/events")
		return response.json()
	}

	let data = getEvents();

	let load = false;

  let allEvents = false;

  function open() {
    allEvents = true;
    data = getEvents();
  }

	onMount(()=>{
		load = true;
	})

</script>

{#if load}
<main transition:fade>

  <IntroBox />

  {#await data}
  <p>venter</p>
  {:then events}
  <EventFrame {events} on:more={open}/>
  {:catch error}
  <p>{error.message}</p>
  {/await}

  <p>{current}</p>

</main>
{/if}
<style>

</style>