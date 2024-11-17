import { defineApp } from "./bundle/app.mjs";
import { comp } from "./bundle/component.mjs";
import { useSignal } from "./bundle/stateble.mjs";
import router from "./bundle/router.mjs";

const app = defineApp()

const home = comp((_, { $, input }) => {
    const firstName = useSignal('')

    input({
        '#model': firstName,
    })
})