import { signal, init, singletone, subscrible } from './bundle/objects.mjs'
import { watch } from './bundle/stateble.mjs'

@singletone()
class User {
    @signal()
    id: number = -1
}

const basketItem = init(User)
