import { defineApp, render, toDomString } from "./core/app.mjs";
import { comp } from "./core/component.mjs";
import { useSignal } from "./core/stateble.mjs";

const app = defineApp()

const main = comp((_, { text, div }) => {
    const counter = useSignal(0, { asRaw: value => `${value}` })
        
    div({}, () => {
        text(counter)
    })
})

await render(app, main)

console.log(toDomString(main.composable))