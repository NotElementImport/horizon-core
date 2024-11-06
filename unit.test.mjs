import { defineApp, render, toDomString } from "./bundle/app.mjs";
import { comp } from "./bundle/component.mjs";

const test = comp((_, { text }) => {
    text('Test text')
})

const app = defineApp()
await render(app, test)
// Test commit
console.log(toDomString(app.composable))