import { comp } from '../horizon/index'

interface Props {
    title: string
    desc: string
}

export default comp<Props>(({ title, desc }, { section, onlyServer, slot, text }) => {
    section({ class: 'island' }, _ => {
        onlyServer(() => {
            section({ class: 'section__title' }, _ => {
                text(title, { clamp: 1 })
            })
        
            section({ class: 'section__desc' }, _ => {
                text(desc, { clamp: 3 })
            })
        })
    
        section({ class: 'section__wrapper'} , _ => {
            // Demo Playground :
            slot()
        })
    })
})