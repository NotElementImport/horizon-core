import { defineApp } from "./bundle/app.mjs";
import { comp } from "./bundle/component.mjs";
import { useSignal } from "./bundle/stateble.mjs";
import router from "./bundle/router.mjs";

const app = defineApp()

const home = comp((_, { $, text }) => {
    $('div', { }, () => {
        text('Home')
    })
})

const about = comp((_, { $, text }) => {
    $('div', { }, () => {
        text('About')
    })
})

const oneItem = comp((_, { $, text }) => {
    $('div', { }, () => {
        text(`Item id: ${id}`)
    })
})

router.setRoutes({
    '/': home,
    '/about': about,
    '/{id}': oneItem
    })
    .setNotFound(comp(({ path }, { $, text }) => {
        $('div', { }, () => {
            text(`Custom not found ${path}`)
        })
    }))
    .push("http://localhost:3000///")

const main = comp((_, { use }) => {
    use(router)
})

const response = await app.renderSSR(main, { })

console.log(response)