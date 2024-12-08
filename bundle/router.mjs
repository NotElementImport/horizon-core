import { isClient } from "./app.mjs";
import { comp, isComponent } from "./component.mjs";
import { useEventMap } from "./composables.mjs";
import { useId, useURLCapture } from "./helpers.mjs";
import { useSignal } from "./stateble.mjs";
const eventHandler = useEventMap();
let defaultNotFound = null;
const route = useSignal({
    notFound: false,
    component: defaultNotFound,
    current: {
        path: '',
        query: {},
        params: {},
        hash: null
    }
});
let routes = {};
const router = comp((_, { dyn, use }) => {
    dyn([route.value.component], () => {
        const { component, notFound, current } = route.value;
        if (component)
            use(component, notFound ? { url: current.path } : {});
    });
});
router.defineRoutes = ($routes) => {
    const readGroup = (group, prefix = '', middleware = []) => {
        for (const [url, data] of Object.entries(group)) {
            if (isComponent(data)) {
                const finalURL = `${prefix}${url[0] != '/' ? '/' + url : url}`;
                routes[finalURL] = { component: data, middleware, path: finalURL.split('/').slice(1) };
                continue;
            }
            readGroup(data.childs, `${prefix}${url}`, [...middleware, ...(data.middleware ?? [])]);
        }
    };
    readGroup($routes);
    return router;
};
router.getRoutes = () => routes;
const updateRouter = async (url) => {
    if (url.origin) {
        window.location = url.fullPath;
        return true;
    }
    const currentPath = url.path.split('/').slice(1);
    let params = {};
    for (const info of Object.values(routes)) {
        if (info.path.length != currentPath.length)
            continue;
        let isBreak = false;
        params = {};
        for (let i = 0; i < info.path.length; i++) {
            const infoPath = info.path[i];
            const currentPathValue = currentPath[i];
            if (infoPath[0] == ':') {
                params[infoPath.slice(1)] = currentPathValue;
            }
            else if (infoPath != currentPathValue) {
                isBreak = true;
                break;
            }
        }
        if (isBreak)
            continue;
        for (const middleware of info.middleware) {
            if (!middleware())
                return false;
        }
        route.value.current = {
            hash: url.hash,
            path: url.path,
            query: url.query,
            params
        };
        route.value.component = info.component;
        return true;
    }
    if (defaultNotFound) {
        route.value.notFound = true;
        route.value.component = defaultNotFound;
    }
    return false;
};
if (isClient) {
    window.addEventListener("popstate", () => {
        const url = useURLCapture(document.location.toString());
        updateRouter(url).then(e => {
            if (e) {
                eventHandler.broadcast('end', (void 0));
                eventHandler.clear('end');
            }
        });
    });
}
router.on = (event, handler) => {
    eventHandler.on(event, handler);
    return router;
};
router.push = async (url) => {
    const urlData = useURLCapture(url);
    return updateRouter(urlData).then(e => {
        if (e == true && isClient)
            history.pushState(useId(), '', urlData.fullPath);
        return e;
    });
};
router.pop = () => {
    if (isClient)
        history.back();
};
router.setNotFound = (comp) => {
    defaultNotFound = comp;
    return router;
};
Object.defineProperty(router, 'current', { get: () => route.value.current });
export default router;
