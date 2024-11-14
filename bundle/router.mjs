import { isClient } from "./app.mjs";
import { comp } from "./component.mjs";
import { useSignal } from "./stateble.mjs";
const instanceRouter = {
    notFound: comp(({ path }, { $, text }) => {
        $('div', {}, () => {
            text(`Not found ${path}`.trim());
        });
    }),
    onPageEnd: (null),
    currentRoute: useSignal({}, { bus: false }),
    beforeResolve: (() => { }),
    routes: {},
    toNotFound(path) {
        this.currentRoute.value.url = path;
        this.currentRoute.value.capture = undefined;
        this.currentRoute.value.component = instanceRouter.notFound;
        this.currentRoute.value.isNotFound = true;
    },
    toLocation(captute) {
        this.currentRoute.value.url = captute.fullPath;
        this.currentRoute.value.capture = captute;
        this.currentRoute.value.component = captute.route?.component;
        this.currentRoute.value.isNotFound = false;
    }
};
const useRouteResolve = (path) => {
    const capture = router.capture(path);
    if (capture.isInternalRoute) {
        for (const middleware of [instanceRouter.beforeResolve, ...(capture.route?.middleware ?? [])]) {
            if (middleware(capture))
                return null;
        }
    }
    if (isClient && capture.origin != null) {
        window.location = capture.fullPath;
    }
    if (instanceRouter.onPageEnd) {
        instanceRouter.onPageEnd();
        instanceRouter.onPageEnd = null;
    }
    if (!capture.isInternalRoute && capture.origin == null)
        return (instanceRouter.toNotFound(capture.fullPath), false);
    return (instanceRouter.toLocation(capture), true);
};
if (isClient) {
    window.addEventListener("popstate", () => {
        useRouteResolve(document.location.toString());
    });
}
instanceRouter.toNotFound('');
const router = comp((_, { dyn, use }) => {
    dyn([instanceRouter.currentRoute.value.component], () => {
        const { component, isNotFound, url } = instanceRouter.currentRoute.value;
        use(component, isNotFound ? { path: url } : {});
    });
});
Object.defineProperty(router, 'defineMiddleware', { get: () => (handle) => handle });
Object.defineProperty(router, 'getRoutes', { get() { return instanceRouter.routes; } });
Object.defineProperty(router, 'current', { get() { return instanceRouter.currentRoute.value.capture; } });
Object.defineProperty(router, 'push', {
    get: () => (value) => {
        return useRouteResolve(value);
    }
});
Object.defineProperty(router, 'pop', {
    get: () => () => {
        if (!isClient)
            return false;
        if (instanceRouter.onPageEnd) {
            instanceRouter.onPageEnd();
            instanceRouter.onPageEnd = null;
        }
        return (window.history.back(), true);
    }
});
Object.defineProperty(router, 'onPage', {
    get: () => (handle) => {
        if (!isClient)
            return;
        instanceRouter.onPageEnd = handle();
    }
});
Object.defineProperty(router, 'onBeforeResolve', {
    get: () => (handle) => {
        return (instanceRouter.beforeResolve = handle(), router);
    }
});
Object.defineProperty(router, 'setNotFound', {
    get: () => (comp) => {
        instanceRouter.notFound = comp;
        return router;
    }
});
Object.defineProperty(router, 'setRoutes', {
    get: () => (routes) => {
        instanceRouter.routes = {};
        const readGroup = (group, prefix = '', middlewares = []) => {
            for (const [path, pathProps] of Object.entries(group)) {
                if (pathProps.composable) {
                    const route = prefix + path;
                    const explode = route.split('/');
                    instanceRouter.routes[route] = {
                        check(otherURL) {
                            const response = { valid: true, params: {} };
                            if (otherURL.length != explode.length)
                                return (response.valid = false, response);
                            for (let i = 0; i < otherURL.length; i++) {
                                const [my, other] = [explode[i], otherURL[i]];
                                if (my[0] != '{' && my != other)
                                    return (response.valid = false, response);
                                else if (my[0] == '{')
                                    response.params[my.slice(1, -1)] = other;
                            }
                            return response;
                        },
                        middleware: middlewares,
                        component: pathProps,
                    };
                    continue;
                }
                readGroup(pathProps.group, prefix + path, [...middlewares, ...(pathProps.middleware ?? [])]);
            }
        };
        readGroup(routes);
        return router;
    }
});
Object.defineProperty(router, 'capture', {
    get: () => (url) => {
        let path = typeof url == 'string' ? url : url.path;
        let query = typeof url == 'string' ? undefined : url.query;
        const parsedURL = new URL(path, path[0] == '/' ? 'http://localhost' : undefined);
        let captured = {
            fullPath: url,
            path: parsedURL.pathname,
            origin: parsedURL.origin.includes('//localhost') ? null : parsedURL.origin,
            port: +(parsedURL.port) || null,
            query: query ?? Object.fromEntries(parsedURL.searchParams.entries()),
            params: {},
            isInternalRoute: false,
            route: undefined
        };
        if (captured.origin != null)
            return captured;
        const explode = captured.path.split('/');
        for (const [_, data] of Object.entries(instanceRouter.routes)) {
            const { valid, params } = data.check(explode);
            if (valid) {
                captured.isInternalRoute = true;
                captured.params = params;
                captured.route = data;
                break;
            }
        }
        return captured;
    }
});
export default router;
