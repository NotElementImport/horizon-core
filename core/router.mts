import { Component, Signal } from "../type";
import { isClient } from "./app.mjs";
import { comp } from "./component.mjs";
import { useId } from "./helpers.mjs";
import { useSignal } from "./stateble.mjs";

// Types
interface HorizonRouterComponentProps {

}

interface HorizonRouterNotFoundProps {
    path: string
}

type HorizonRouterComponent = Component.Component<HorizonRouterComponentProps, {}>

interface HorizonRouter extends HorizonRouterComponent {
    readonly current: Signal.ProxySignal<HorizonRoute>
    defineMiddleware(handle: (to: HorizonRoute) => boolean|void): Function
    onBeforeCapture(handle: (to: string) => string): HorizonRouter
    onBeforeResolve(handle: (to: HorizonRoute) => boolean|void): HorizonRouter
    onPage(handle: () => (() => void)): void
    pop(or: () => boolean|void): boolean
    push(url: string|HorizonRouterBuilder): boolean
    capture(url: string|HorizonRouterBuilder): HorizonRoute
    setRoutes(struct: HorizonRouteStruct): HorizonRouter
    setNotFound(comp: Component.Component<HorizonRouterNotFoundProps, {}>): HorizonRouter
    readonly getRoutes: Record<string, Route>
}

interface HorizonRouteStruct {
    [key: string] : ({
        group: HorizonRouteStruct
        middleware: (() => void|boolean|Promise<void|boolean>)[]
    }) | Component.Component
}

interface HorizonRouterBuilder {
    path: string,
    query: Record<string, any>
}

type HorizonRoute = {
    fullPath: string
    origin: string
    path: string
    port: number|null
    query: Record<string, unknown>
    params: Record<string, unknown>
    isInternalRoute: boolean
    route?: Route
}

interface Route {
    middleware: Function[]
    check: (otherURL: string[]) => { valid: true, params: Record<string, any> }
    component: Component.Component
}

// Logic
const instanceRouter = {
    notFound: comp<HorizonRouterNotFoundProps, {}>(({ path }, { $, text }) => {
        $('div', { }, () => {
            text(`Not found ${path}`.trim())
        })
    }),
    onPageEnd: (null) as (Function|null),
    onBeforeResolve: (() => {}) as ((to: HorizonRoute) => (void|boolean)),
    onBeforeCapture: (raw => raw) as ((to: string) => (string)),
    currentRoute: useSignal<Route & { isNotFound: boolean, component?: Component.Component, capture?: HorizonRoute, url?: string }>({} as any),
    routes: {} as Record<string, Route>,
    toNotFound(path: string) {
        this.currentRoute.value.url = path
        this.currentRoute.value.capture = undefined
        this.currentRoute.value.component = instanceRouter.notFound
        this.currentRoute.value.isNotFound = true
    },
    toLocation(captute: HorizonRoute) {
        this.currentRoute.value.url = captute.fullPath
        this.currentRoute.value.capture = captute
        this.currentRoute.value.component = captute.route?.component as any
        this.currentRoute.value.isNotFound = false
    }
}

const useRouteResolve = (path: string|HorizonRouterBuilder) => {
    if(instanceRouter.onBeforeCapture) {
        if(typeof path == 'object')
            path.path = instanceRouter.onBeforeCapture(path.path)
        else 
            path = instanceRouter.onBeforeCapture(path)
    }

    const capture: HorizonRoute = router.capture(path)

    if(capture.isInternalRoute) {
        for (const middleware of [instanceRouter.onBeforeResolve, ...(capture.route?.middleware ?? [])]) {
            if(middleware(capture))
                return null
        }
    }

    if(isClient && capture.origin != null) {
        window.location = capture.fullPath as any
    }

    if(instanceRouter.onPageEnd) {
        instanceRouter.onPageEnd()
        instanceRouter.onPageEnd = null
    }        

    if(!capture.isInternalRoute && capture.origin == null)
        return (instanceRouter.toNotFound(capture.fullPath), false)
    return (instanceRouter.toLocation(capture), true)
}

if(isClient) {
    window.addEventListener("popstate", () => {
        useRouteResolve(document.location.toString())
    });
}

instanceRouter.toNotFound('')

const router: HorizonRouter = comp((_, { dyn, use }) => {
    dyn([ instanceRouter.currentRoute.value.component ], () => {
        const { component, isNotFound, url } = instanceRouter.currentRoute.value
        use(component, isNotFound ? { path: url } : { })
    })
}) as any

// @ts-ignore
router.defineMiddleware = (handle: Function) => handle
// @ts-ignore
router.onPage = (handle: () => (() => void)) => (!isClient ? void 0 : (instanceRouter.onPageEnd = handle(), void 0))
// @ts-ignore
router.onBeforeResolve = (handle: Function) => (instanceRouter.onBeforeResolve = handle, router)
// @ts-ignore
router.onBeforeCapture = (handle: Function) => (instanceRouter.onBeforeCapture = handle, router)
// @ts-ignore
router.setNotFound = (comp: Component.Component<HorizonRouterNotFoundProps, {}>) => (instanceRouter.notFound = comp, router)
// @ts-ignore
router.push = (value: string|HorizonRouterBuilder) => useRouteResolve(value)
// @ts-ignore
router.pop = () => {
    if(!isClient) return false
    if(instanceRouter.onPageEnd) {
        instanceRouter.onPageEnd()
        instanceRouter.onPageEnd = null
    }
    return (window.history.back(), true)
}
// @ts-ignore
router.setRoutes = (routes: HorizonRouteStruct) => {
    instanceRouter.routes = {}
    const readGroup = (group: HorizonRouteStruct, prefix: string = '', middlewares: Function[] = []) => {
        for (const [path, pathProps] of Object.entries(group)) {
            // @ts-ignore
            if(pathProps.composable) {
                const route = prefix+path
                const explode = route.split('/')
                instanceRouter.routes[route] = {
                    check(otherURL) {
                        const response: any = { valid: true, params: {} }
                        if(otherURL.length != explode.length)
                            return (response.valid = false, response)
                        for (let i = 0; i < otherURL.length; i ++) {
                            const [my, other] = [explode[i], otherURL[i]]
                            if(my[0] != '{' && my != other) return (response.valid = false, response)
                            else if(my[0] == '{') response.params[my.slice(1,-1)] = other
                        }
                        return response
                    },
                    middleware: middlewares,
                    // @ts-ignore
                    component: pathProps,
                }
                continue
            }

            // @ts-ignore
            readGroup(pathProps.group, prefix+path, [...middlewares, ...(pathProps.middleware ?? [])])
        }
    }
    readGroup(routes)
    return router
}
// @ts-ignore
router.capture = (url: string|HorizonRouterBuilder) => {
    let path = typeof url == 'string' ? url : url.path;
    let query = typeof url == 'string' ? undefined : url.query;
    const parsedURL = new URL(path, path[0] == '/' ? 'http://localhost' : undefined)
    let captured = {
        fullPath: url,
        path: parsedURL.pathname,
        origin: parsedURL.origin.includes('//localhost') ? null : parsedURL.origin,
        port: +(parsedURL.port) || null,
        query: query ?? Object.fromEntries(parsedURL.searchParams.entries()),
        params: {},
        isInternalRoute: false,
        route: undefined as Route|undefined
    }

    if(captured.origin != null)
        return captured

    const explode = captured.path.split('/') 
    for (const [_, data] of Object.entries(instanceRouter.routes)) {
        const { valid, params } = data.check(explode)

        if(valid) {
            captured.isInternalRoute = true
            captured.params = params
            captured.route = data
            break
        }
    }
    return captured
}

Object.defineProperty(router, 'getRoutes', { get() { return instanceRouter.routes } })
Object.defineProperty(router, 'current',   { get() { return instanceRouter.currentRoute.value.capture } })

export default router as unknown as HorizonRouter