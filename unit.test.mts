import { defineRepositoryFactory } from './core/repository.mjs'
import { useComputed, useSignal } from './core/stateble.mjs'

const valueOne = useSignal('My name')
const valueTwo = useSignal('my name')
const comput   = useComputed(() => 
    `${valueOne.value} is ${valueTwo.value}`
)

console.log(comput.value)