import { comp } from './core/component.mts'
import Router from './core/router.mjs'

const main = comp((_, { }) => {

})

const checkAuth = () => true

Router.defineRoutes({
    '': {
        childs: {
            '': main,
            ':id': main
        },
        middleware: [ checkAuth ],
    } 
})

console.log(await Router.push('/10'))