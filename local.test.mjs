import { useSignal, watch } from './bundle/stateble.mjs'
import { useSubscribe } from './bundle/composables.mjs'

const subs = useSubscribe()

const unsub = subs.on(v => console.log(`first ${v}`))

subs.emit('Test')

unsub()
subs.on(v => console.log(`second ${v}`))

subs.emit('Test')