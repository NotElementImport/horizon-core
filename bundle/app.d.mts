import { Component, Primitive } from "../type";
import { IStack } from "./stack.mjs";
export interface IHorizonApp {
    readonly composable: Primitive.ComponentNode<null>;
    readonly leadComposable: Primitive.ComponentNode<any>;
    get hydCounter(): number;
    set hydCounter(v: number);
    get hydMeta(): string;
    set hydMeta(v: string);
    readonly isDev: boolean;
    pipe(composable: Primitive.ComponentNode<any>, parent?: Primitive.ComponentNode<any>): void;
    domPipe(dom: HTMLElement | Element, parent?: Primitive.ComponentNode<any>): void;
    domPipeTo(dom: HTMLElement | Element, index: number, parent?: Primitive.ComponentNode<any>): void;
    pipeTo(composable: Primitive.ComponentNode<any>, index: number, parent?: Primitive.ComponentNode<any>): void;
    lead(composable: Primitive.ComponentNode<any>, handle: () => (Promise<void> | void)): Promise<void>;
    clearHeap(): void;
    stack: IStack;
}
export declare const isClient: boolean;
export declare function useComposite<K extends PropertyKey | null>(type: K, props: Record<string, any>, inline?: boolean): Primitive.ComponentNode<K>;
export declare let currentApp: IHorizonApp;
export declare function defineApp(conifg?: {
    devMode?: boolean;
}): IHorizonApp;
export declare function render<T extends Record<string, any>>(app: IHorizonApp, comp: Component.Component<T>, props?: T): Promise<void>;
export declare function toDomString(comp: Primitive.ComponentNode<any>): string;
export declare function toDom(type: keyof HTMLElementTagNameMap, props: Record<string, any>): {
    readonly isAlive: boolean;
    dom: HTMLElement;
    click(handle: Function): void;
    hover(handle: Function): void;
    lost(handle: Function): void;
};
