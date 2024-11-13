// import { defineApp } from "./bundle/app.mjs";
// import { comp } from "./bundle/component.mjs";
// import { useSignal } from "./bundle/stateble.mjs";

// const useWait = async (ms = 1000) => {
//     return new Promise((resolve) => {
//         setTimeout(() => resolve(), ms)
//     })
// }

// const app = defineApp()

// const articles = useSignal([
//     { title: 'Title 1' },
//     { title: 'Title 2' }
// ], { bus: 'articles' })

// const main = comp((_, { img }) => {

// })

// await app.renderSSR(main, { withMeta: true, unmountAtEnd: true })