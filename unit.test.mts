import { defineRepositoryFactory } from './core/repository.mjs'
import { useComputed, useSignal } from './core/stateble.mjs'

const valueOne = useSignal('My name')
const valueTwo = useSignal('my name')
const comput   = useComputed((raw) => 
    `${raw(valueOne)} is ${raw(valueTwo)}`
)

console.log(comput.value)
valueTwo.value = 'test'
console.log(comput.value)