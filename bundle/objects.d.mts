export declare function singletone(): (target: any, ctx: ClassDecoratorContext) => void;
export declare function signal(): (_: any, ctx: ClassFieldDecoratorContext) => (value: any) => any;
export declare function storage(config?: {
    prefix?: string;
}): (_: any, ctx: ClassFieldDecoratorContext) => (value: any) => any;
export declare function define<T, A extends unknown[]>(item: {
    new (...args: A): T;
}, ...props: A): T;
