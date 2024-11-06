import { comp } from '../horizon/index'

export default comp((_, { section, onlyServer, text, slot, img }) => {
    section({ class: 'app__layout' }, _ => {
        onlyServer(() => {
            section({ class: 'app__title' }, _ => {
                text('Horizon', { class: 'app__title__main' })
                text('Next', { class: 'app__title__sub' })
                text(' + ', { style: 'margin-inline: 0.5em;' })
                img('/vite.svg')
            })
        })

        slot()
    })
})