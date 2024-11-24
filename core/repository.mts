import { useSignal } from "./stateble.mjs"

const repositoryArchive = new Map<any, object>()

const compileRepository = (object: any, args: any[] = []) => {
    const instance = new object(...args)
    for (const propertyName of Object.getOwnPropertyNames(instance)) {
        const signal = useSignal(instance[propertyName])
        Object.defineProperty(instance, propertyName, {
            get: () => signal.value,
            set: (v) => { signal.value = v }
        })
    }
    return instance
}

export const defineRepository = <T extends any>(object: { new(): T }): T => {
    if(repositoryArchive.has(object))
        return repositoryArchive.get(object) as T
    const instance = compileRepository(object)
    return instance as T
}

export const defineRepositoryFactory = <T extends any, K extends any[]>(object: { new(...args: K): T }): ((...args: K) => T) => {
    return (...args: K) => compileRepository(object, args) as T
}