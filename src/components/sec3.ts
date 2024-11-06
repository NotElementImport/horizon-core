import { comp, state } from '../horizon/index'
import sectionWrapper from './sectionWrapper'

export default comp((_, { use, dyn, dom, section, text }) => {
    use(sectionWrapper, {
        title: '3. State-ы!',
        desc: 'Можно изменять состояние DOM c State-ом'
    }, () => {
        // Template:
        section({}, _ => {
            const counter = state(0);

            dom('button', { class: 'demo__button' })
                .click(() => counter.value += 1)
                .caption(`Счётчик +`)
    
            text('counter = ', { style: 'margin-left: 1em;' })
            text(counter)
        })

        section({style: 'margin-top: 1em;'}, _ => {
            const isRed = state(false);

            dyn('button', { style: () => (isRed.value ? 'background: coral;' : ''), class: 'demo__button' }, ({ click, watch, caption }) => {
                watch(isRed)
                click(() => {
                    isRed.value = !isRed.value;
                })
    
                caption(!isRed.value ? `Нажми на меня я стану красным!` : `Нажми на меня я стану обычным!`)
            })

            text('isRed = ', { style: 'margin-left: 1em;' })
            text(isRed)
        })
    })
})