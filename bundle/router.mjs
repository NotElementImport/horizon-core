import { isClient } from "./app.mjs";
import { comp, isComponent } from "./component.mjs";
import { useEventMap } from "./composables.mjs";
import { useId, useURLCapture } from "./helpers.mjs";
import { useSignal, watch } from "./stateble.mjs";
const eventHandler = useEventMap();
let defaultNotFound = null;
const route = useSignal({
    notFound: false,
    component: defaultNotFound,
    animation: null,
    animationReverse: false,
    current: {
        path: "",
        query: {},
        params: {},
        hash: null,
    },
});
let routes = {};
const router = comp((_, { dyn, use }) => {
    const triggerForRedraw = useSignal(false);
    watch(route.value.component, () => {
        const redraw = () => triggerForRedraw.value = !triggerForRedraw.value;
        if (!route.value.animation) {
            return redraw();
        }
        const isReversed = route.value.animationReverse;
        const animationMeta = {
            duration: 300,
            easing: "ease-in",
            direction: "normal",
        };
        const initStyle = () => {
            dynDom.dom.style.position = "absolute";
            dynDom.dom.style.display = "block";
            dynDom.dom.style.width = "100%";
            dynDom.dom.style.height = "100%";
        };
        const rollbackStyle = () => {
            dynDom.dom.style.removeProperty("position");
            dynDom.dom.style.removeProperty("display");
            dynDom.dom.style.removeProperty("width");
            dynDom.dom.style.removeProperty("height");
        };
        const animations = {
            "h-slide": () => {
                initStyle();
                dynDom.dom.animate([
                    { left: "0" },
                    { left: isReversed ? "-100%" : "100%" },
                ], animationMeta).onfinish = () => {
                    redraw();
                    dynDom.dom.animate([
                        { left: isReversed ? "100%" : "-100%" },
                        { left: "0" },
                    ], animationMeta).onfinish = () => {
                        rollbackStyle();
                    };
                };
            },
            "v-slide": () => {
                initStyle();
                dynDom.dom.animate([
                    { top: "0" },
                    { top: isReversed ? "-100%" : "100%" },
                ], animationMeta).onfinish = () => {
                    redraw();
                    dynDom.dom.animate([
                        { top: isReversed ? "100%" : "-100%" },
                        { top: "0" },
                    ], animationMeta).onfinish = () => {
                        rollbackStyle();
                    };
                };
            },
            "fade": () => {
                initStyle();
                dynDom.dom.animate([
                    { opacity: "1" },
                    { opacity: "0" },
                ], animationMeta).onfinish = () => {
                    redraw();
                    dynDom.dom.animate([
                        { opacity: "0" },
                        { opacity: "1" },
                    ], animationMeta).onfinish = () => {
                        rollbackStyle();
                    };
                };
            },
        };
        animations[route.value.animation]();
    });
    const dynDom = dyn([triggerForRedraw], () => {
        const { component, notFound, current } = route.value;
        if (component) {
            use(component, notFound ? { url: current.path } : {});
        }
    });
});
router.defineRoutes = ($routes) => {
    const readGroup = (group, prefix = "", middleware = []) => {
        for (const [url, data] of Object.entries(group)) {
            if (isComponent(data)) {
                const finalURL = `${prefix}${url[0] != "/" ? "/" + url : url}`;
                routes[finalURL] = {
                    component: data,
                    middleware,
                    path: finalURL.split("/").slice(1),
                };
                continue;
            }
            readGroup(data.childs, `${prefix}${url}`, [
                ...middleware,
                ...(data.middleware ?? []),
            ]);
        }
    };
    readGroup($routes);
    return router;
};
router.getRoutes = () => routes;
const updateRouter = async (url, options = {}) => {
    if (url.origin) {
        window.location = url.fullPath;
        return true;
    }
    const currentPath = url.path.split("/").slice(1);
    let params = {};
    for (const info of Object.values(routes)) {
        if (info.path.length != currentPath.length)
            continue;
        let isBreak = false;
        params = {};
        for (let i = 0; i < info.path.length; i++) {
            const infoPath = info.path[i];
            const currentPathValue = currentPath[i];
            if (infoPath[0] == ":") {
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
            if (!middleware()) {
                return false;
            }
        }
        route.value.current = {
            hash: url.hash,
            path: url.path,
            query: url.query,
            params,
        };
        if (!(options.silent ?? false)) {
            route.value.component = info.component;
        }
        route.value.notfound = false;
        return true;
    }
    if (defaultNotFound) {
        route.value.notfound = true;
        route.value.component = defaultNotFound;
    }
    return false;
};
if (isClient) {
    window.addEventListener("popstate", () => {
        const url = useURLCapture(document.location.toString());
        updateRouter(url).then((e) => {
            if (e) {
                eventHandler.broadcast("end", void 0);
                eventHandler.clear("end");
            }
        });
    });
}
router.on = (event, handler) => {
    eventHandler.on(event, handler);
    return router;
};
router.push = async (url, options = {}) => {
    const urlData = useURLCapture(url);
    route.value.animation = options.animation ?? null;
    route.value.animationReverse = options.animationReverse ?? false;
    return updateRouter(urlData, options).then((e) => {
        route.value.animation = null;
        route.value.animationReverse = false;
        if (e == true && isClient) {
            history.pushState(useId(), "", urlData.basePath);
        }
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
Object.defineProperty(router, "current", { get: () => route.value.current });
export default router;
