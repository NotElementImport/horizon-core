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
    rollback(or: () => boolean|void): boolean
    push(url: string|HorizonRouterBuilder): boolean
    redirect(url: string|HorizonRouterBuilder): boolean
    capture(url: string): HorizonRoute
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
    component: Component.Component|undefined
}

interface Route {
    check: (otherURL: string[]) => { valid: boolean, params: Record<string, unknown> }
    component: Component.Component
}

// Logic
const instanceRouter = {
    notFound: comp<HorizonRouterNotFoundProps, {}>(({ path }, { $, text }) => {
        $('div', { }, () => {
            text(`Not found ${path}`.trim())
        })
    }),
    // @ts-ignore
    currentRoute: useSignal<Route & { isNotFound: boolean, component?: Component.Component, capture?: HorizonRoute, url?: string }>({}, { bus: false }),
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
        this.currentRoute.value.component = captute.component as any
        this.currentRoute.value.isNotFound = false
    }
}

if(isClient) {
    window.addEventListener("popstate", () => {
        // @ts-ignore
        const capture: HorizonRoute = router.capture(document.location.toString())

        if(isClient) {
            if(capture.origin != null)
                window.location = capture.fullPath as any
        }

        if(!capture.isInternalRoute && capture.origin == null)
            return (instanceRouter.toNotFound(capture.fullPath), false)
        return (instanceRouter.toLocation(capture), true)

    });
}

instanceRouter.toNotFound('')

const router = comp((_, { dyn, use }) => {
    dyn([ instanceRouter.currentRoute.value.component ], () => {
        const { component, isNotFound, url } = instanceRouter.currentRoute.value

        use(component, isNotFound ? { path: url } : { })
    })
})
Object.defineProperty(router, 'getRoutes', { get() { return instanceRouter.routes } })
Object.defineProperty(router, 'current',   { get() { return instanceRouter.currentRoute.value.capture } })

Object.defineProperty(router, 'push', { 
    get: () => (value: string|HorizonRouterBuilder) => {
        // @ts-ignore
        const capture: HorizonRoute = router.capture(value)

        if(isClient) {
            if(capture.origin != null)
                window.location = capture.fullPath as any
            else
                history.pushState(useId(), '', capture.fullPath)
        }

        if(!capture.isInternalRoute && capture.origin == null)
            return (instanceRouter.toNotFound(capture.fullPath), false)
        return (instanceRouter.toLocation(capture), true)
    }
})

Object.defineProperty(router, 'setNotFound', { 
    get: () => (comp: Component.Component<HorizonRouterNotFoundProps, {}>) => {
        instanceRouter.notFound = comp
        return router
    }
})

Object.defineProperty(router, 'setRoutes', {
    get: () => (routes: HorizonRouteStruct) => {
        instanceRouter.routes = {}

        const readGroup = (group: HorizonRouteStruct, prefix: string = '', middlewares: Function[] = []) => {
            for (const [path, pathProps] of Object.entries(group)) {
                // @ts-ignore
                if(pathProps.composable) {
                    const route = prefix+path
                    const explode = route.split('/')
                    instanceRouter.routes[route] = {
                        check(otherURL) {
                            const response = { valid: true, params: {} as any }
                            if(otherURL.length != explode.length)
                                return (response.valid = false, response)
                            for (let i = 0; i < otherURL.length; i ++) {
                                const [my, other] = [explode[i], otherURL[i]]
                                if(my[0] != '{' && my != other) return (response.valid = false, response)
                                else if(my[0] == '{') response.params[my.slice(1,-1)] = other
                            }
                            for (const middleware of middlewares) {
                                const middlewareResponse = middleware() ?? false

                                if(middlewareResponse) {
                                    response.valid = false; break
                                }
                            }
                            return response
                        },
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
})

Object.defineProperty(router, 'capture', {
    get: () => (url: string|HorizonRouterBuilder) => {
        let path = typeof url == 'string' ? url : url.path;
        let query = typeof url == 'string' ? undefined : url.query;
        const parsedURL = new URL(path, path[0] == '/' ? 'http://localhost' : undefined)
        const captured = {
            fullPath: url,
            path: parsedURL.pathname,
            origin: parsedURL.origin.includes('//localhost') ? null : parsedURL.origin,
            port: +(parsedURL.port) || null,
            query: query ?? Object.fromEntries(parsedURL.searchParams.entries()),
            params: {},
            isInternalRoute: false,
            component: undefined
        }

        if(captured.origin != null)
            return captured

        const explode = captured.path.split('/') 
        for (const [_, data] of Object.entries(instanceRouter.routes)) {
            const { valid, params } = data.check(explode)

            if(valid) {
                captured.isInternalRoute = true
                captured.params = params
                captured.component = data.component as any
                break
            }
        }
        return captured
    }
})

export default router as unknown as HorizonRouter