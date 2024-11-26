import { isSignal, useComputed, useSignal, useStrongRef, watch } from './bundle/stateble.mjs'
import { comp } from './bundle/component.mjs'
import { defineApp } from './bundle/app.mjs'
import { useColorSheme, useDocumentBody, useDocumentHtml, useGetDOM, useLocalStorage, useNormalizer } from './bundle/composables.mjs'

const testApp = defineApp()

const article = comp(({ title = 'Unknow' }, { $, text }) => {
    $('article', {  }, () => {
        if(typeof title == 'function')
            title()
        else
            text(title)
    })
})

article.warning = () => {
    show
}

const main = comp((_, { $, text, use }) => {
    article.functing()

    use(article, {
        title: "data"
    })
})

const html = await testApp.renderSSR(main, { withSecurity: true, unmountAtEnd: true })
console.log(html)