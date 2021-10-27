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
		const response = await fetch(`api/${url}`)
    .catch((error) => {console.log(error)});
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
  let tabpromise = getData("tabs");

  let allEvents = false;

  function open() {
    allEvents = true;
    data = getEvents();
  }

</script>

  {#await tabpromise}
  <IntroBox />
  {:then tabs}
  <IntroBox {tabs}/>
  {:catch error}
  <p>Noe gikk galt: {error.message}</p>
  {/await}
  


  {#await data}
  <p>venter</p>
  {:then events}
  <EventFrame {events} on:more={open}/>
  {:catch error}
  <p>{error.message}</p>
  {/await}

  <img src="/static/frontend/banner_bottom.jpg" alt="En illustrasjon av dansende par">

  <Blog {post}/>

<style>

  img {
    width: 100%;
  }

</style>