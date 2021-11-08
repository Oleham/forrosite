<script>
	import IntroBox from './components/IntroBox.svelte'
	import EventFrame from './components/EventFrame.svelte';
  import BlogFrame from './components/BlogFrame.svelte';

  

  let posts = [{
        title: "Title",
        ingress:"Text",
        body: "Text",
        img: {
          src: "media/event-images/plassholder.jpg",
          alt: "Folkefest med forro"
        }
    },]


	async function getData(url) {
		const response = await fetch(`api/${url}`)
    .catch((error) => {console.log(error)});
		return response.json()
	}


  async function getPosts() {
    await fetch("api/posts")
    .then(data => data.json())
    .then((payload) => {posts = payload})
    .catch((error) => {console.log(error)})
  }

  let data = getData("events");
  getPosts();
  let tabpromise = getData("tabs");

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
  <EventFrame {events} />
  {:catch error}
  <p>{error.message}</p>
  {/await}

  <img src="/static/frontend/banner_bottom.jpg" alt="En illustrasjon av dansende par">

  <BlogFrame {posts}/>

<style>

  img {
    width: 100%;
  }

</style>