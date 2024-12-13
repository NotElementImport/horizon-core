import type { Component, Primitive } from "../type.d.ts";
import { IStack } from "./stack.mjs";
export interface IHorizonApp {
    readonly composable: Primitive.ComponentNode<null>;
    readonly leadComposable: Primitive.ComponentNode<any>;
    readonly isHydrate: boolean;
    get hydCounter(): number;
    set hydCounter(v: number);
    get hydMeta(): string;
    set hydMeta(v: string);
    readonly isDev: boolean;
    pipe(composable: Primitive.ComponentNode<any>, parent?: Primitive.ComponentNode<any>): void;
    domPipe(dom: HTMLElement | Element, parent?: Primitive.ComponentNode<any>): void;
    domPipeTo(dom: HTMLElement | Element, index: number, parent?: Primitive.ComponentNode<any>): void;
    pipeTo(composable: Primitive.ComponentNode<any>, index: number, parent?: Primitive.ComponentNode<any>): void;
    lead(composable: Primitive.ComponentNode<any>, handle: () => Promise<void> | void): Promise<void>;
    clearHeap(): void;
    renderSSR(component: Component.Component, config?: {
        withMeta?: boolean;
        withSecurity?: boolean;
        onlyString?: boolean;
        unmountAtEnd?: boolean;
    }): Promise<string>;
    renderDOM(component: Component.Component): Promise<void>;
    renderComponent(component: Component.Component, props: any): Promise<void>;
    stack: IStack;
}
export declare const isClient: boolean;
export declare function useComposite<K extends PropertyKey | null>(type: K, props: Record<string, any>, inline?: boolean): Primitive.ComponentNode<K>;
export declare let currentApp: IHorizonApp;
export declare function defineApp(conifg?: {
    devMode?: boolean;
}): IHorizonApp;
