import App from './App.svelte';

const app = new App({
	target: document.getElementById("sap-app"),
	hydrate: true
});

export default app;