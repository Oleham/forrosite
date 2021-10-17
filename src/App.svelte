<script>
	import IntroBox from './components/IntroBox.svelte'
	import EventFrame from './components/EventFrame.svelte';

	async function getEvents() {
		const response = await fetch("api/events");
		return response.json()
	}

	let data = getEvents();

  let allEvents = false;

  function open() {
    allEvents = true;
    data = getEvents();
  }

</script>


  <IntroBox />

  {#await data}
  <p>venter</p>
  {:then events}
  <EventFrame {events} on:more={open}/>
  {:catch error}
  <p>{error.message}</p>
  {/await}


  <p>Some static element</p>


<style>

</style>