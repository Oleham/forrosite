require("svelte/register");
const fs = require("fs");
const path = require("path")
const App = require('./src/App.svelte').default;

const { html, head } = App.render({}, {hydratable: true, emitCSS:false});

const template = fs.readFileSync(path.join(__dirname, "src", "index.template"), "utf-8");

const output = template.replace('%body%', html).replace("%head%", head);

fs.writeFileSync(path.join(__dirname, "frontend", "templates", "frontend", "index.html"), output, "utf-8")