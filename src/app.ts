import layout from './components/layout'
import sec1 from './components/sec1'
import sec2 from './components/sec2'
import sec3 from './components/sec3'
import sec4 from './components/sec4'
import sec5 from './components/sec5'
import sec6 from './components/sec6'
import sec7 from './components/sec7'
import { comp, addStyloFile } from './horizon/index'

export default comp(async (_, { use, onlyClient }) => {
    addStyloFile('/style.css')

    use(layout, {}, () => {
        use(sec1, {})
        use(sec2, {})
        use(sec3, {})
        use(sec4, {})
        use(sec5, {})
        use(sec6, {})
        use(sec7, {})
    })
})