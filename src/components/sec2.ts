import { comp } from '../horizon/index'
import sectionWrapper from './sectionWrapper'

export default comp((_, { use, dom }) => {
    use(sectionWrapper, {
        title: '2. Состояние у статического DOM-а',
        desc: 'Можно изменять состояние DOM без State-а'
    }, () => {
        // Demo:
        let counter = 0;
        let counterLabel = () => `Счётчик: ${counter}`;

        dom('button', { class: 'demo__button' }, ({ click, caption }) => {
            click(() => {
                counter += 1;
                caption(counterLabel())
            })
            caption(counterLabel())
        })
    })
})