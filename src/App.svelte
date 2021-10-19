<script>
	import IntroBox from './components/IntroBox.svelte'
	import EventFrame from './components/EventFrame.svelte';
  import Blog from './components/Blog.svelte';


  let post = {
        title: "Title",
        ingress:"Text",
        body: "Text",
        img: {
          src: "media/event-images/plassholder.jpg",
          alt: "Folkefest med forro"
        }
    }
  

	async function getData(url) {
		const response = await fetch(`api/${url}`);
		return response.json()
	}


  async function getPosts() {
    await fetch("api/posts")
    .then(data => data.json())
    .then((payload) => {post = payload[0]})
    .catch((error) => {console.log(error)})
  }

  let data = getData("events");
  getPosts();

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

  <Blog {post}/>

<style>

</style>