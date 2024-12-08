import { useLocalStorage } from "./composables.mjs"
import { useSignal } from "./stateble.mjs"

const signletoneMap = new Map()
const modifySym     = Symbol()
const isSingletone  = Symbol()

export function singletone() {
    return function(target: any, ctx: ClassDecoratorContext) {
        target[modifySym] = true
        target[isSingletone] = true
    }
}

export function signal() {
    return function(_: any, ctx: ClassFieldDecoratorContext) {
        const signal = useSignal(null)

        ctx.addInitializer(function() {
            Object.defineProperty(this, ctx.name, { get: () => signal.value, set: (v) => signal.value = v })
        })

        return (value: any) => {
            signal.value = value
            return value
        }
    }
}

export function storage(config: { prefix?: string } = { }) {
    return function(_: any, ctx: ClassFieldDecoratorContext) {
        ctx.addInitializer(function() {
            // @ts-ignore
            const signal = useLocalStorage<string>(`${config.prefix ?? 'storage-'}${ctx.name as string}`, { defaultValue: this[ctx.name] })
            Object.defineProperty(this, ctx.name, { get: () => signal.value, set: (v) => signal.value = v })
        })

        return (value: any) => value
    }
}

export function define<T, A extends unknown[]>(item: { new(...args: A): T }, ...props: A): T {
    let instance: T

    // @ts-ignore
    if(!item[modifySym])
        instance = new item(...props)
    else {
        instance = signletoneMap.get(item) ?? new item(...props)

        // @ts-ignore
        if(item[isSingletone] && !signletoneMap.has(item))
            signletoneMap.set(item, instance)
    }
        

    return instance    
}