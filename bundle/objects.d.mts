export declare function singletone(): (target: any, ctx: ClassDecoratorContext) => void;
export declare function signal(): (_: any, ctx: ClassFieldDecoratorContext) => (value: any) => any;
export declare function storage(config?: {
    prefix?: string;
}): (_: any, ctx: ClassFieldDecoratorContext) => (value: any) => any;
export declare function record(): (target: any, ctx: ClassDecoratorContext) => void;
export declare function methodGet(): (target: Function, ctx: ClassMethodDecoratorContext) => (...args: any[]) => any;
export declare function methodPost(): void;
export declare function methodPut(): void;
export declare function methodDelete(): void;
export declare function define<T, A extends unknown[]>(item: {
    new (...args: A): T;
}, ...props: A): T;
