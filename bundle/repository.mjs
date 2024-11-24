import { useSignal } from "./stateble.mjs";
const repositoryArchive = new Map();
const compileRepository = (object, args = []) => {
    const instance = new object(...args);
    for (const propertyName of Object.getOwnPropertyNames(instance)) {
        const signal = useSignal(instance[propertyName]);
        Object.defineProperty(instance, propertyName, {
            get: () => signal.value,
            set: (v) => { signal.value = v; }
        });
    }
    return instance;
};
export const defineRepository = (object) => {
    if (repositoryArchive.has(object))
        return repositoryArchive.get(object);
    const instance = compileRepository(object);
    return instance;
};
export const defineRepositoryFactory = (object) => {
    return (...args) => compileRepository(object, args);
};
