import { Component, Signal } from "../type";
interface HorizonRouterComponentProps {
}
interface HorizonRouterNotFoundProps {
    path: string;
}
type HorizonRouterComponent = Component.Component<HorizonRouterComponentProps, {}>;
interface HorizonRouter extends HorizonRouterComponent {
    readonly current: Signal.ProxySignal<HorizonRoute>;
    onPage(handle: () => (() => void)): void;
    pop(or: () => boolean | void): boolean;
    push(url: string | HorizonRouterBuilder): boolean;
    capture(url: string): HorizonRoute;
    setRoutes(struct: HorizonRouteStruct): HorizonRouter;
    setNotFound(comp: Component.Component<HorizonRouterNotFoundProps, {}>): HorizonRouter;
    readonly getRoutes: Record<string, Route>;
}
interface HorizonRouteStruct {
    [key: string]: ({
        group: HorizonRouteStruct;
        middleware: (() => void | boolean | Promise<void | boolean>)[];
    }) | Component.Component;
}
interface HorizonRouterBuilder {
    path: string;
    query: Record<string, any>;
}
type HorizonRoute = {
    fullPath: string;
    origin: string;
    path: string;
    port: number | null;
    query: Record<string, unknown>;
    params: Record<string, unknown>;
    isInternalRoute: boolean;
    route?: Route;
};
interface Route {
    middleware: Function[];
    check: (otherURL: string[]) => {
        valid: true;
        params: Record<string, any>;
    };
    component: Component.Component;
}
declare const _default: HorizonRouter;
export default _default;
