import { defineApp, render } from './bundle/app.mjs'
import { comp } from './bundle/component.mjs'

const app = defineApp({ devMode: true })

const compn = comp((_, { div }) => {
    div({
        style: {}
    })
})

render(app, compn)