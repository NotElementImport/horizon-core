import { useParallel, useProcess } from './bundle/composables.mjs'

let count1 = 0, count2 = 0

await useParallel([
    () => useProcess(abort => {
        console.log('Task 1')
        count1 += 1
        if(count1 > 10) abort()
    }, { period: '2 sec' }),
    () => useProcess(abort => {
        console.log('Task 2')
        count2 += 1
        if(count2 > 10) abort()
    }, { period: '1 sec' })
])