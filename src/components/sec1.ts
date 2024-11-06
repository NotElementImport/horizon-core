import { comp } from '../horizon/index'
import sectionWrapper from './sectionWrapper'

export default comp((_, { use, dom }) => {
    use(sectionWrapper, {
        title: '1. Статический DOM',
        desc: 'Фреймворк позволяет рисовать статические сайты с логикой.'
    }, () => {
        // Demo:
        dom('button', { class: 'demo__button' })
            .click(() => alert('На клиенте так-же можно писать логику!'))
            .caption('Нажми на меня!')
    })
})