export declare const defineRepository: <T extends unknown>(object: {
    new (): T;
}) => T;
export declare const defineRepositoryFactory: <T extends unknown, K extends any[]>(object: {
    new (...args: K): T;
}) => ((...args: K) => T);
