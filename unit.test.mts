import { defineRepositoryFactory } from './core/repository.mjs'
import { useComputed, useSignal } from './core/stateble.mjs'

const valueOne = useSignal('My name')
const valueTwo = useSignal('My name')
const comput   = useComputed(() => 
    `${valueOne.value} is ${valueTwo.value}`
)

console.log(comput.value)
valueTwo.value = 'shit'
console.log(comput.value)