import { comp, toHTML, state } from './src/horizon/index.js'
import * as fs from 'node:fs'

const label = state('Hello World!')

const app = comp((_, { div, text }) => {
    div({}, () => {
        div({}, () => {
            text(label)
        })
    })
})

app.render({})

fs.writeFileSync("output.html", 
    toHTML(app.meta)
); 