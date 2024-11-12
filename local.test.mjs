import { defineApp } from "./bundle/app.mjs";
import { comp } from "./bundle/component.mjs";
import { useSignal } from "./bundle/stateble.mjs";

const useWait = async (ms = 1000) => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), ms)
    })
}

const app = defineApp()

const articles = useSignal([
    { title: 'Title 1' },
    { title: 'Title 2' }
], { bus: 'articles' })

const main = comp((_, { dyn, div, text, onUnmount }) => {
    dyn([articles], () => {
        for (const [index, article] of Object.entries(articles.value)) {
            div({}, _ => {
                text(article.title)

                onUnmount(() => {
                    console.log(`${index} div goodbye`)
                })
            })
        }

        onUnmount(() => {
            console.log(`struct goodbye`)
        })
    })
})

await app.renderSSR(main, { withMeta: true, unmountAtEnd: true })

// articles.value.push({ title: 'title 3' })

await useWait(100)