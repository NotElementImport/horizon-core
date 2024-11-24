import { comp } from './bundle/component.mjs'
import { useSyncSignal } from './bundle/shared.mjs'
import { defineApp } from './bundle/app.mjs'

const test = useSyncSignal('Hello world!')

const testApp = defineApp()

const main = comp((_, { $, text, input }) => {
    $('div', { }, () => {
        input({ '#model': test, '#lazy': false })
        text(test)
    })
})

const html = await testApp.renderSSR(main, { withMeta: true })
console.log(html)