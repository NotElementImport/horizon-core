import { useStylePrettify } from "./helpers.mjs";
import { useStack } from "./stack.mjs";
import { tryGetRaw, useStrongRef, watch, clearSignalHeap, busSignal } from "./stateble.mjs";
export const isClient = typeof document !== 'undefined';
const arrayInsert = (array, index, value) => {
    return [...array.slice(0, index), value, ...array.slice(index, array.length)];
};
const sCompoisteUnmounted = Symbol();
export function useComposite(type, props, inline = false) {
    return {
        [sCompoisteUnmounted]: [],
        unmount(deep = true) {
            for (const callback of this[sCompoisteUnmounted])
                callback(this);
            if (deep)
                for (const child of this.childs)
                    child.unmount();
            this.childs = [];
        },
        type,
        dom: null,
        props,
        inline,
        childs: []
    };
}
export let currentApp = null;
export function defineApp(conifg = {}) {
    const $app = useComposite(null, {});
    let stack = useStack();
    let currentComposable = $app;
    let hydrateCounter = 0;
    let hydrateMeta = '$';
    let isHydrate = false;
    const $instance = {
        clearHeap() {
            hydrateCounter = 0;
            hydrateMeta = '$';
            currentComposable = $app;
            $app.dom = null;
            clearSignalHeap();
        },
        get isHydrate() { return isHydrate; },
        get isDev() { return conifg.devMode ?? false; },
        get stack() { return stack; },
        set stack(v) { stack = v; },
        get composable() { return $app; },
        get leadComposable() { return currentComposable; },
        get hydCounter() { return hydrateCounter; },
        set hydCounter(v) { hydrateCounter = v; },
        get hydMeta() { return hydrateMeta; },
        set hydMeta(v) { hydrateMeta = v; },
        async lead(composable, handle) {
            const prev = currentComposable;
            currentComposable = composable;
            await handle();
            currentComposable = prev;
        },
        pipe(composable, parent) {
            if (parent)
                return parent.childs.push(composable);
            currentComposable.childs.push(composable);
        },
        domPipe(dom, parent) {
            if (!isClient)
                return;
            if (parent && parent.dom)
                return parent.dom.appendChild(dom);
            else if (currentComposable.dom)
                currentComposable.dom.appendChild(dom);
        },
        domPipeTo(dom, index, parent) {
            if (!isClient)
                return;
            const to = parent ? parent.dom : currentComposable.dom;
            if (to && index + 1 >= to.childNodes.length)
                return to.appendChild(dom);
            else if (to)
                to.insertBefore(dom, to.children[index + 1]);
        },
        pipeTo(composable, index, parent) {
            const to = parent ? parent.childs : currentComposable.childs;
            if (index + 1 >= to.length)
                return to.push(composable);
            if (parent)
                parent.childs = arrayInsert(parent.childs, index + 1, composable);
            currentComposable.childs = arrayInsert(currentComposable.childs, index + 1, composable);
        },
        async renderSSR(component, config = {}) {
            if (!(config.onlyString ?? false)) {
                await render($instance, component);
            }
            let ssrMeta = '';
            if (config.withMeta ?? false) {
                ssrMeta += '<script id="ssr-meta-object" type="application/json">';
                const ssrMetaObject = { bus: {} };
                for (const [key, signal] of busSignal.entries()) {
                    ssrMetaObject.bus[key] = signal.value;
                }
                ssrMeta += JSON.stringify(ssrMetaObject);
                ssrMeta += '</script>';
            }
            const response = ssrMeta + toDomString(component.composable);
            if (config.withSecurity ?? true) {
                if (config.unmountAtEnd ?? false)
                    component.composable.unmount();
                else
                    component.composable.childs = [];
                component.composable.dom = null;
                component.composable.props = {};
            }
            $instance.clearHeap();
            return response;
        },
        async renderDOM(component) {
            if (!isClient)
                throw new Error('Horizon: RenderDOM work only in client side');
            isHydrate = true;
            const ssrMeta = document.getElementById('ssr-meta-object');
            if (ssrMeta) {
                const ssrMetaObject = JSON.parse(ssrMeta.innerHTML);
                for (const [key, value] of Object.entries(ssrMetaObject.bus)) {
                    busSignal.set(key, value);
                }
            }
            await render($instance, component);
            isHydrate = false;
        },
        async renderComponent(comp, props) {
            await render($instance, comp, props);
        }
    };
    currentApp = $instance;
    return $instance;
}
async function render(app, comp, props) {
    const oldStack = app.stack;
    app.stack = useStack();
    if (!props)
        app.pipe(comp.composable);
    await app.lead(comp.composable, () => {
        const $nodes = {
            onUnmount(handle) {
                const parent = app.leadComposable;
                parent[sCompoisteUnmounted].push(handle);
            },
            slot(args = {}) {
                const stack = app.stack;
                const parent = app.leadComposable;
                const initMeta = app.hydMeta + app.hydCounter + 'slt';
                const myCounter = app.hydCounter;
                stack.push(async () => {
                    const currentMeta = app.hydMeta;
                    const oldCounter = app.hydCounter;
                    app.hydCounter = myCounter;
                    app.hydMeta = initMeta;
                    await app.lead(parent, async () => {
                        await props.slot(args);
                    });
                    app.hydMeta = currentMeta;
                    app.hydCounter = oldCounter;
                });
                app.hydCounter += 1;
            },
            use(other, props = {}, slot = () => { }) {
                const stack = app.stack;
                const parent = app.leadComposable;
                const oldMeta = app.hydMeta;
                const hash = app.hydMeta + `${app.hydCounter}$`;
                const scoped = {
                    composable: {
                        ...other.composable,
                        childs: [],
                        dom: app.leadComposable.dom
                    },
                    slot: other.slot
                };
                const index = app.hydCounter;
                stack.push(async () => {
                    app.hydMeta = hash;
                    await render(app, scoped, props = { ...props, hash, slot });
                    app.hydMeta = oldMeta;
                    app.pipeTo(scoped.composable, index, parent);
                });
                app.hydCounter += 1;
            },
            $(...args) {
                const stack = app.stack;
                const parent = app.leadComposable;
                let domParent = app.leadComposable.dom;
                const oldMeta = app.hydMeta;
                const hash = app.hydMeta + `${app.hydCounter}${args[0].slice(0, 3)}`;
                const props = { ...(args[1] ?? {}), hash };
                if (props['$parent']) {
                    if (!isClient)
                        return (app.hydCounter += 1, void 0);
                    domParent = props.$parent;
                    delete props['$parent'];
                }
                const vDom = toDom(args[0], props);
                const index = app.hydCounter;
                stack.push(async () => {
                    const node = useComposite(args[0], props);
                    node.dom = vDom.dom;
                    if (args[2]) {
                        await app.lead(node, async () => {
                            const oldCounter = app.hydCounter;
                            app.hydCounter = 0;
                            app.hydMeta = hash;
                            await args[2](vDom);
                            app.hydMeta = oldMeta;
                            app.hydCounter = oldCounter;
                        });
                    }
                    app.pipeTo(node, index, parent);
                    app.domPipeTo(vDom.dom, index, { dom: domParent });
                });
                app.hydCounter += 1;
                return vDom;
            },
            text(...args) {
                const stack = app.stack;
                const hash = app.hydMeta + `${app.hydCounter}txt`;
                const props = { ...args[1], html: args[0], hash };
                const vDom = toDom('span', props);
                const parent = app.leadComposable;
                const index = app.hydCounter;
                stack.push(async () => {
                    const node = useComposite('span', props);
                    node.dom = vDom.dom;
                    app.pipeTo(node, index, parent);
                    app.domPipeTo(vDom.dom, index, parent);
                });
                app.hydCounter += 1;
                return vDom;
            },
            img(...args) {
                const stack = app.stack;
                const hash = app.hydMeta + `${app.hydCounter}txt`;
                const props = { ...args[1], src: args[0], hash };
                const vDom = toDom('img', props);
                const parent = app.leadComposable;
                const index = app.hydCounter;
                stack.push(async () => {
                    const node = useComposite('img', props, true);
                    node.dom = vDom.dom;
                    app.pipeTo(node, index, parent);
                    app.domPipeTo(vDom.dom, index, parent);
                });
                app.hydCounter += 1;
                return vDom;
            },
            div(...args) {
                return $nodes.$('div', ...args);
            },
            dyn(follower, slot, config = {}) {
                const stack = app.stack;
                const parent = app.leadComposable;
                const hash = app.hydMeta + `${app.hydCounter}dyn`;
                const props = { style: 'display: contents;', hash };
                const vDom = toDom('dynamic', props);
                const node = useComposite('dynamic', props);
                node.dom = vDom.dom;
                const dynamicRender = async () => {
                    if (isClient)
                        vDom.dom.innerHTML = '';
                    if (config.unmount ?? true)
                        node.unmount(config.deepUnmount ?? true);
                    else
                        node.childs = [];
                    await app.lead(node, async () => {
                        const oldCounter = app.hydCounter;
                        app.hydCounter = 0;
                        app.hydMeta = hash;
                        await slot();
                        app.hydCounter = oldCounter;
                    });
                };
                for (const state of follower) {
                    watch(state, () => {
                        const oldStack = app.stack;
                        app.stack = stack;
                        stack.push(async () => {
                            const oldMeta = app.hydMeta;
                            await dynamicRender();
                            app.hydMeta = oldMeta;
                        });
                        stack.run(true).then(() => app.stack = oldStack);
                    });
                }
                const index = app.hydCounter;
                stack.push(async () => {
                    const oldMeta = app.hydMeta;
                    await dynamicRender();
                    app.hydMeta = oldMeta;
                    app.pipeTo(node, index, parent);
                    app.domPipeTo(vDom.dom, index, parent);
                });
                app.hydCounter += 1;
                return vDom;
            },
        };
        comp.slot(props, $nodes);
    });
    const stack = app.stack;
    await stack.run();
    stack.clear();
    app.stack = oldStack;
    if (!props)
        app.hydCounter = 0;
}
function toDomString(comp) {
    let result = '';
    const layer = (comp) => {
        if (!comp.type)
            return comp.childs.forEach(e => layer(e));
        result += `<${comp.type}`;
        for (const [name, value] of Object.entries(comp.props)) {
            if (name == 'html' || name[0] == '@' || !value)
                continue;
            else if (name == 'style')
                result += ` ${name}="${useStylePrettify(tryGetRaw(value))}"`;
            else if (name == 'class')
                result += ` ${name}="${Array.isArray(value) ? value.join(' ') : tryGetRaw(value)}"`;
            else
                result += ` ${name}="${tryGetRaw(value)}"`;
        }
        result += `>`;
        if (comp.inline)
            return;
        if (comp.props.html)
            result += tryGetRaw(comp.props.html);
        else
            for (const composable of comp.childs) {
                layer(composable);
            }
        result += `</${comp.type}>`;
    };
    layer(comp);
    return result;
}
function toDom(type, props) {
    let dom = null;
    const eventExist = {};
    const eventSet = (name, handle) => {
        if (name.includes('.')) {
            let [actualName, behaviour] = name.split('.');
            const mainHandle = handle;
            switch (behaviour) {
                case 'stop':
                    {
                        handle = (ev) => {
                            mainHandle(ev);
                            ev.stopPropagation();
                        };
                    }
                    break;
                case 'prevent':
                    {
                        handle = (ev) => {
                            ev.preventDefault();
                            mainHandle(ev);
                        };
                    }
                    break;
            }
            name = actualName;
        }
        if (name in eventExist)
            return;
        switch (name) {
            case 'click':
                {
                    dom.addEventListener('click', handle);
                }
                break;
            case 'hover':
                {
                    dom.addEventListener('mouseenter', handle);
                }
                break;
            case 'lost':
                {
                    dom.addEventListener('mouseleave', handle);
                }
                break;
        }
    };
    let isHydrate = true, alive = true;
    const isDeleted = () => {
        if (!isHydrate && alive && dom.getRootNode() != document) {
            return alive = !alive, true;
        }
        return !alive;
    };
    if (isClient) {
        dom = document.querySelector(`[hash="${props.hash}"]`)
            ?? document.createElement(type);
        for (const [key, value] of Object.entries(props)) {
            if (key == 'html')
                useStrongRef(value, (v, unwatch) => {
                    if (isDeleted())
                        return unwatch();
                    dom.innerHTML = v;
                });
            else if (key[0] == '@')
                eventSet(key.slice(1), value);
            else if (key == 'style')
                useStrongRef(value, (v) => {
                    dom.setAttribute('style', useStylePrettify(v));
                }, true);
            else if (key == 'class')
                useStrongRef(value, (v) => {
                    dom.setAttribute('class', Array.isArray(v) ? v.join(' ') : v);
                }, true);
            else
                useStrongRef(value, (v, unwatch) => {
                    if (isDeleted())
                        return unwatch();
                    v != null
                        ? dom.setAttribute(key, v)
                        : dom.removeAttribute(key);
                });
        }
    }
    isHydrate = false;
    const vDom = {
        get isAlive() { return !isDeleted(); },
        dom,
        click(handle) { if (isClient)
            eventSet('click', handle); },
        hover(handle) { if (isClient)
            eventSet('hover', (ev) => ev.currentTarget == ev.target ? handle(ev) : null); },
        lost(handle) { if (isClient)
            eventSet('lost', (ev) => ev.currentTarget == ev.target ? handle(ev) : null); },
    };
    return vDom;
}
