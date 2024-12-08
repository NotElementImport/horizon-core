import type { Component } from "../type.d.ts";
export declare function comp<P extends object, S extends object>(slot: Component.ComponentHandler<P, S>): Component.Component<P, S>;
export declare const isComponent: (data: unknown) => boolean;
export declare function mod<P extends object, S extends object>(slot: Component.ComponentHandler<P, S>): Component.Module<P, S>;
