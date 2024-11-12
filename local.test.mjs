import { defineApp, isClient } from "./bundle/app.mjs";
import { comp } from "./bundle/component.mjs";
import { useComputed, useSignal } from "./bundle/stateble.mjs";

const app = defineApp()

const articles = useSignal([
    { title: 'Title 1' },
    { title: 'Title 2' }
])

const main = comp((_, { dyn, div, text, onUnmount }) => {
    dyn([articles], () => {
        for (const [index, article] of Object.entries(articles.value)) {
            div({}, _ => {
                text(article.title)
            })
        }
    })

    onUnmount(() => {
        console.log(`goodbye`)
    })
})

await app.renderSSR(main, { withMeta: true, unmountAtEnd: true })

// articles.value.push({ title: 'Title 3' })

// const useWait = async (ms = 1000) => {
//     return new Promise((resolve) => {
//         setTimeout(() => resolve(), ms)
//     })
// }
// await useWait(1000)