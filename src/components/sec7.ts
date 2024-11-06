import { comp } from '../horizon/index'
import sectionWrapper from './sectionWrapper'

export default comp((_, { use, slip, section, text, dyn, dom }) => {
    use(sectionWrapper, {
        title: '7. Продвинутый режим отлова ошибок.',
        desc: 'При помощи slip можно ловить ошибки, и отрисовать им шаблон'
    }, () => {
        let enableError = true

        dyn('div', {}, ({ updateState }) => {
            // Demo:
            slip(
                () => {
                    if(enableError)
                        throw { message: 'Упс кажись у вас проблемы' }
                    
                    text('Теперь всё нормально')
                }, 
                (type, err) => {
                    dom('button', {})
                        .click(() => updateState(() => {
                            enableError = false
                        }))
                        .caption('Перезагрузить')

                    section({style: 'margin-top: 1em;'})
                        .caption(`Ошибка: ${err.message}. На: ${type}`)
                }
            )
        })
    })
})