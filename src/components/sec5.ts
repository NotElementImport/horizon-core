import { comp } from '../horizon/index'
import sectionWrapper from './sectionWrapper'

export default comp((_, { use, onlyServer, text, section }) => {
    use(sectionWrapper, {
        title: '5. Константные элементы (Для оптимизации)',
        desc: 'Их рисует только сервер и клиент не может с ними взаимодействовать'
    }, () => {
        // Demo:
        onlyServer(() => {
            const textDOM = text('Я нарисован на сервере, у меня есть логика на клик, но клиент не может узнать((')
            if(textDOM?.click)
                textDOM.click(() => alert('Я не врал'))
        })
    })
})