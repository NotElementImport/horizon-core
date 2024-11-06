import { comp } from '../horizon/index'
import sectionWrapper from './sectionWrapper'

export default comp((_, { use, onlyClient, text }) => {
    use(sectionWrapper, {
        title: '4. Только на клиенте',
        desc: 'Можно отрисовывать контент только на клиенте'
    }, () => {
        // Demo:
        onlyClient(() => {
            text('Я есть только на клиенте!')
        })
    })
})