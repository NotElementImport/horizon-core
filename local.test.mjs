import { useCacheControl, useFetch } from './bundle/fetching.mjs'

import { useComputed, useSignal, useStrongRef } from './bundle/stateble.mjs'
import { comp } from './bundle/component.mjs'
import { defineApp } from './bundle/app.mjs'

const testApp = defineApp()

const products = comp(async (_, { $, text, inject, dyn }) => {
    const { response: productsResponse, restart: getProducts, fetching } = useFetch({ path: 'https://dummyjson.com/products', query: { limit: 15 } }, { type: 'json', immediate: false, defaultValue: {} })
    const countOfChars = useSignal(0)

    inject(() => getProducts())

    // Products
    $('div', { 'aria-label': 'Products' }, () => {
        dyn([fetching], () => {
            if(fetching.value)
                return text('Loading')

            const { products = [], total = 0 } = productsResponse.value

            for (const product of products) {
                $('div', { }, () => {
                    text(`Product ${product.title}`)
               })
            }

            inject(async () => countOfChars.value = products.reduce((p, c) => p + c.description.length, 0))

            text(`Total: ${total}`)
            text(useComputed(raw => `Chars: ${raw(countOfChars)}`))
        })
    })
})

const main = comp((_, { use }) => {
    use(products)
})

const html = await testApp.renderSSR(main, { })
console.log(html)