import { defineApp } from './bundle/app.mjs'
import { comp, mod } from './bundle/component.mjs'
import { isSignal, useComputed, useProxySignal, useSignal, useStrongRef, watch } from './bundle/stateble.mjs'

let isFail = false
const useTest = async (name, handle) => {
    try { await handle(); console.log(` ✅ Pass : ${name}`)
    }
    catch (e) {
        isFail = true; console.log(` ❌ Fail : ${name}, Cause : ${e}`)
    }
}
const conclusion = () => {
    if(isFail)
        console.log(` ❌ Build Fail`)
    else
        console.log(` ✅ Build Pass`)
    console.log('')
    process.exit(isFail ? 1 : 0)
}
const useWatchCheck = (signal, trySetValue = '', awaited = null) => {
    if(awaited == null) awaited = trySetValue
    const unwatch = watch(signal, (value) => {
        if(value != awaited)
            throw `Watch check, value is not: ${awaited}`
    })

    if(isSignal(signal))
        signal.value = trySetValue
    else
        signal = trySetValue

    unwatch()
}
const useWait = async (ms = 1000) => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), ms)
    })
}

console.log('')
console.log(' Validate Build:')
console.log('')
await useTest('Define App', () => {
    const app = defineApp()
})

await useTest('Base / Render Simple App', async () => {
    const app = defineApp()
    const testComp = comp((_, { text, div }) => { div({}, () => { text('Test') }) })
    const response = await app.renderSSR(testComp)
    if(response != '<div hash="$0div"><span hash="$0div0txt">Test</span></div>')
        throw `Component string isn't right: ${response}`
})

const appForTest = defineApp()
await useTest('Base / Render signal', async () => {
    const testSignal = useSignal('Test')
    const testComp = comp((_, { text, div }) => { div({}, () => { text(testSignal) }) })
    const response = await appForTest.renderSSR(testComp)
    if(response != '<div hash="$0div"><span hash="$0div0txt">Test</span></div>')
        throw `Component string isn't right: ${response}`
})

await useTest('Base / Render signal as json', async () => {
    const testSignal = useSignal({ "message": "hello world!" })
    const testComp = comp((_, { text, div }) => { div({}, () => { text(testSignal) }) })
    const response = await appForTest.renderSSR(testComp)
    if(response != '<div hash="$0div"><span hash="$0div0txt">{"message":"hello world!"}</span></div>')
        throw `Component string isn't right: ${response}`
})

await useTest('Signal / Testing watch', async () => {
    const testSignal = useSignal(0)

    useWatchCheck(testSignal, 1)

    let messageCount = 0
    const testSignalJson = useSignal({ "message": "hello world!", "other": "test" })
    watch(testSignalJson, (value) => {
        messageCount += 1
    }, { deep: true })
    watch(testSignalJson.value.message, (value) => {
        messageCount += 1
    })
    testSignalJson.value.message = 'Test 1'
    testSignalJson.value.other =   'Test 2'

    if(messageCount != 3)
        throw `Count messages is not equal 3: ${messageCount}`
})

await useTest('Signal / Signal Relations', async () => {
    const parentSignal = useSignal('Parent message')
    const childSignal = useSignal(parentSignal.value)

    parentSignal.value = 'Test message'
    if(childSignal.value != 'Test message')
        throw `Child messages is not equal Test message: ${childSignal.value}`

    childSignal.value = 'Hello parent'
    if(parentSignal.value != 'Hello parent')
        throw `Child messages is not equal Hello parent: ${parentSignal.value}`
})

await useTest('Signal / Proxing signal', async () => {
    const proxy = useProxySignal(useSignal({
        'message': 'hello'
    }))

    proxy.message = 'Test message'
    if(proxy.message != 'Test message')
        throw `Proxy.message is not equal Test message: ${proxy.message}`

    useWatchCheck(proxy.message, 'Hello')
})

await useTest('Signal / Computed', async () => {
    const person = useSignal({
        firstName:  'Test',
        lastName:   'Testov',
        middleName: 'Sr.',
    })
    const age = useSignal(100)
    const personInfo = useComputed(() => 
        `Person ${person.value.lastName} ${person.value.firstName} ${person.value.middleName} his age ${age.value}`
    )
    
    if(personInfo.value != 'Person Testov Test Sr. his age 100')
        throw `useComputed is failed: ${personInfo.value}`

    person.value.firstName = 'New Name'
    if(personInfo.value != 'Person Testov New Name Sr. his age 100')
        throw `useComputed is failed: ${personInfo.value}`

    person.value = {
        firstName: 'fValid',
        lastName: 'lValid',
        middleName: 'mValid',
    }

    if(personInfo.value != 'Person lValid fValid mValid his age 100')
        throw `useComputed is failed: ${personInfo.value}`
})

await useTest('Complex / Render module', async () => {
    const testMod = mod(({ title }, { text, div }) => {
        div({ 'aria-label': 'Title' }, () => {
            text(title)
        })
    })
    const testComp = comp((_, { }) => { testMod({ title: 'Test title' }) })
    const response = await appForTest.renderSSR(testComp)
    if(response != '<div aria-label="Title" hash="$0$0div"><span hash="$0$0div0txt">Test title</span></div>')
        throw `Component string isn't right: ${response}`
})

await useTest('Complex / Render component', async () => {
    const testMod = comp(({ title }, { text, div }) => {
        div({ 'aria-label': 'Title' }, () => {
            text(title)
        })
    })
    const testComp = comp((_, { use }) => { use(testMod, { title: 'Test title' }) })
    const response = await appForTest.renderSSR(testComp)
    if(response != '<div aria-label="Title" hash="$0$0div"><span hash="$0$0div0txt">Test title</span></div>')
        throw `Component string isn't right: ${response}`
})

await useTest('Complex / Slot in component', async () => {
    const testMod = comp((_, { div, slot }) => {
        div({ 'aria-label': 'Title' }, () => {
            slot()
        })
    })
    const testComp = comp((_, { use, text }) => { use(testMod, {}, () => { text('Test title') }) })
    const response = await appForTest.renderSSR(testComp)
    if(response != '<div aria-label="Title" hash="$0$0div"><span hash="$0$0div0slt0txt">Test title</span></div>')
        throw `Component string isn't right: ${response}`
})

await useTest('Complex / Dynamic render', async () => {
    const articles = useSignal([
        { title: 'Test 1' },
        { title: 'Test 2' }
    ])

    const testComp = comp((_, { text, div, dyn }) => { 
        dyn([ articles ], () => {
            for (const article of articles.value) {
                div({ }, () => {
                    text(article.title)
                })
            }
        })
    })

    let response = await appForTest.renderSSR(testComp, { withSecurity: false })
    if(response != '<dynamic style="display: contents;" hash="$0dyn"><div hash="$0dyn0div"><span hash="$0dyn0div0txt">Test 1</span></div><div hash="$0dyn1div"><span hash="$0dyn1div0txt">Test 2</span></div></dynamic>')
        throw `Component string isn't right: ${response}`

    articles.value.push({ title: 'Test 3' })
    await useWait(30)

    response = await appForTest.renderSSR(testComp, { onlyString: true })
    if(response != '<dynamic style="display: contents;" hash="$0dyn"><div hash="$0dyn0div"><span hash="$0dyn0div0txt">Test 1</span></div><div hash="$0dyn1div"><span hash="$0dyn1div0txt">Test 2</span></div><div hash="$0dyn2div"><span hash="$0dyn2div0txt">Test 3</span></div></dynamic>')
        throw `Component string isn't right: ${response}`
})

await useTest('Complex / Strong ref check', async () => {
    const articles = useSignal({
        test: 'Test value'
    })

    let valueForTest = ''
    useStrongRef(articles.value.test, (raw) => valueForTest = raw)

    if(valueForTest != 'Test value')
        throw `Value from strong ref isn't right: ${valueForTest}`

    articles.value.test = 'New value'
    if(valueForTest != 'New value')
        throw `Value from strong ref isn't right: ${valueForTest}`
})

await useTest('Complex / Strong ref check', async () => {
    const articles = useSignal({
        test: 'Test value'
    })

    let valueForTest = ''
    useStrongRef(articles.value.test, (raw) => valueForTest = raw)

    if(valueForTest != 'Test value')
        throw `Value from strong ref isn't right: ${valueForTest}`

    articles.value.test = 'New value'
    if(valueForTest != 'New value')
        throw `Value from strong ref isn't right: ${valueForTest}`
})
console.log('')
conclusion()