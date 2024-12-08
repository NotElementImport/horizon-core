import { defineApp } from './bundle/app.mjs'
import { comp } from './bundle/component.mjs'
import Router from './bundle/router.mjs'
import { useComputed, useSignal, watch } from './bundle/stateble.mjs'

const test = useSignal({ test: 'asdsad' })

const otherTest = useSignal(test)

otherTest.value.test = 'wawa'

console.log(test.value, otherTest.value)