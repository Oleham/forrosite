// Script for generating server rendered page for the SAP app.

require("svelte/register");
const fs = require("fs");
const path = require("path")
const App = require('./src/App.svelte').default;

const target = path.join(__dirname, "frontend", "templates", "frontend", "index.html")

const { html, head } = App.render({}, {hydratable: true, emitCSS:false});

const template = fs.readFileSync(path.join(__dirname, "src", "index.template"), "utf-8");

const output = template.replace('%body%', html).replace("%head%", head);

fs.writeFileSync(target, output, "utf-8")
console.log("ssr.js built " + target)