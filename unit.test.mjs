import { assertEquals } from "jsr:@std/assert"
import { defineApp } from './bundle/app.mjs'
import { comp, mod } from './bundle/component.mjs'
import { isSignal, unSignal, useComputed, useProxySignal, useSignal } from './bundle/stateble.mjs'

Deno.test("Signal creating", () => {
    let signal = useSignal(null)
    assertEquals(signal.value, 'null')
    assertEquals(signal.unsafe, null)

    signal = useSignal(0)
    assertEquals(signal.value, 0)

    signal = useSignal('Test value')
    assertEquals(signal.value, 'Test value')

    signal = useSignal(false)
    assertEquals(signal.value, false)

    signal = useSignal([0,1,2])
    assertEquals(JSON.stringify(signal.value), "[0,1,2]")

    signal = useSignal({ message: "Hello" })
    assertEquals(JSON.stringify(signal.value), `{"message":"Hello"}`)
})

Deno.test("Signal as raw", () => {
    const signal = useSignal({ firstName: 'Test', lastName: 'Doe' },{
        asRaw({ firstName, lastName }) {
            return `My name ${lastName} ${firstName}`
        }    
    })

    assertEquals(signal.asRaw, 'My name Doe Test')
})

Deno.test("{Proxy} signals", () => {
    const signal = useProxySignal(useSignal({ firstName: 'Test', lastName: 'Doe' }))
    assertEquals(signal.firstName, 'Test')
    assertEquals(signal.lastName, 'Doe')
})

Deno.test("Computed signals", () => {
    const firstName = useSignal('Test')
    const lastName = useSignal('Doe')
    const computed = useComputed(un => `My name ${un(lastName)} ${un(firstName)}`)

    assertEquals(unSignal(computed), 'My name Doe Test')
    firstName.value = 'First'
    assertEquals(unSignal(computed), 'My name Doe First')
})

Deno.test("Validate signals", () => {
    const firstName = useSignal('Test')
    const computed = useComputed(un => `My name ${un(firstName)}`)

    assertEquals(isSignal(firstName), true)
    assertEquals(isSignal(computed), true)
    assertEquals(isSignal("test"), false)
    assertEquals(isSignal(firstName.value), false)
})

Deno.test("Creating app", () => {
    defineApp()
}) 

const testApp = defineApp()

Deno.test("Create component", async () => {
    const test = comp((_, { $ }) => {
        $('div', { html: "Primitive app" })
    })
    const result = await testApp.renderSSR(test)
    assertEquals(result, '<div hash="$0div">Primitive app</div>')
})

Deno.test("Signal in Component", async () => {
    const test = comp((_, { $ }) => {
        $('div', { html: useSignal("Test value") })
    })
    const result = await testApp.renderSSR(test)
    assertEquals(result, '<div hash="$0div">Test value</div>')
})

Deno.test("Computed in Component", async () => {
    const test = comp((_, { $ }) => {
        const testSignal = useSignal("Empty...")
        $('div', { html: useComputed(un => un(testSignal)) })
        testSignal.value = 'Test value'
    })
    const result = await testApp.renderSSR(test)
    assertEquals(result, '<div hash="$0div">Test value</div>')
})