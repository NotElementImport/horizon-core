import internal from "stream";
import { symWatch, symState, symWatchers} from "./service";

const symComponent = Symbol('component')
const isClient = typeof document !== 'undefined'

export let appStyles = [];

export const resetStylo = () => {
    appStyles = [];
};

export const stylo = (css) => {
    if(!isClient)
        appStyles.push({raw: css})
};

export const addStylo = (importPath) => {
    if(!isClient)
        appStyles.push({path: importPath})
};


export const state = (value) => {
    const proxy = {
        [symState]: true,
        [symWatchers]: [],
        [symWatch]: (handle) => {
            proxy[symWatchers].push(handle)
        },
        get value() {
            return value
        },
        set value(v) {
            value = v
            proxy[symWatchers].forEach(e => {
                e(value)
            })
        }
    };
    return proxy
};

export const watch = (value, handle) => {
    value[symWatch](handle)
};

export const usePromise = () => {
    let [ resolve, reject ] = [ () => {}, () => {} ]
    const promise = new Promise((_1, _2) => {[resolve, reject] = [_1, _2]})
    return { promise, resolve, reject }
};

export const toHTML = (instance) => {
    const recursive = (object) => {
        let response = '';

        if(object.type !== symComponent) {
            response += `<${object.type}`;

            for (let [name, value] of Object.entries(object.props)) {
                if(Array.isArray(value)) {
                    value = value.join(' ')
                }
                else if(typeof value == 'function') {
                    value = value()
                }

                response += ` ${name}="${value}"`;
            }
            response += '>';
        }

        if(Array.isArray(object.children)) {
            for (const item of object.children) {
                response += recursive(item)
            }
        }
        else {
            response += object.children;
        }

        if(object.type !== symComponent && object.type != 'img' && object.type != 'input') {
            response += `</${object.type}>`;
        }

        return response
    };

    return recursive(instance)
};

export const toDOM = (info, uid, parent = null, update = false) => {
    /** @type { HTMLElement } */
    let element = globalThis[uid]

    if(!element && parent || update && isClient) {
        element = document.createElement(info.type);

        for (let [name, value] of Object.entries(info.props ?? {})) {
            if(Array.isArray(value)) {
                value = value.join(' ')
            }
            else if(typeof value == 'function') {
                value = value()
            }

            element.setAttribute(name, value);
        }

        if(!Array.isArray(info.children)) {
            element.innerHTML = info.children
        }

        if(!(update && isClient)) {
            parent.appendChild(element)
        }
    }
    
    const vars = {
        isHasClickEvent: false,
    };

    return {
        dom: element,
        update() {
            for (let [name, value] of Object.entries(info.props ?? {})) {
                if(Array.isArray(value)) {
                    value = value.join(' ')
                }
                else if(typeof value == 'function') {
                    value = value()
                }
    
                element.setAttribute(name, value);
            }
    
            if(!Array.isArray(info.children)) {
                element.innerHTML = info.children
            }
        },
        click(handle) {
            if(isClient && !vars.isHasClickEvent) {
                element.addEventListener('click', handle);
                vars.isHasClickEvent = true;
            }
        },
        caption(text) {
            if(isClient) {
                if(typeof text === 'object') {
                    text = JSON.stringify(text)
                }

                element.innerHTML = text
            }
            info.children = text
        },
        removeChilds() {
            if(isClient) {
                element.innerHTML = ''
            }
        },
        remove() {
            if(isClient) element.remove();
        }
    };
};

export const comp = (builder) => {
    let prefix = ''

    const instance = {
        type: symComponent,
        props: {},
        children: [],
        context: {},
        parent: null,
        isServer: false,
        slot: () => {},
    };

    const getId = (type, children) => {
        if(typeof children === 'number')
            return `${prefix}${(type ?? 'nlpt').slice(0, 3)}${children}`
        return `${prefix}${(type ?? 'nlpt').slice(0, 3)}${children.length}`
    };

    const pushChild = (other) => {
        instance.children.push(other)
    };

    const methods = {
        isClient,
        onlyClient(handle) {
            if(isClient) {
                return handle()
            }
        },
        onlyServer(handle) {
            const oldIsServer = instance.isServer
            instance.isServer = isClient ? true : false
            
            const result = handle()

            if(result instanceof Promise) {
                return result.then(e => {
                    instance.isServer = oldIsServer
                })
            }

            instance.isServer = oldIsServer
            return 
        },
        slot() {
            return instance.slot(instance.children)
        },
        dyn(type, props, handle) {
            if(instance.isServer) {
                pushChild(null)
                return
            }

            const previousChildrens = instance.children;
            const index = previousChildrens.length + 1;
            const oldPrefix = prefix;
            const oldParent = instance.parent
            const domInstance = {
                children: [],
                type,
                props
            };

            const tempPrefix = getId(type, index);
            domInstance.props.id =  tempPrefix;

            let dom = toDOM(domInstance, tempPrefix, oldParent);
            domInstance.parent = dom?.dom;

            const dynVars = {
                isWatching: false
            };
            
            const dynMethod = {
                ...dom,
                setState(handle) {
                    handle()
                    dom.update()
                    render()
                },
                watch(...variables) {
                    if(isClient && !dynVars.isWatching) {
                        variables.forEach(e => {
                            e[symWatch](() => {
                                dynMethod.setState(() => {})
                            })
                            dynVars.isWatching = true
                        })
                    }
                }
            } 

            let clear = () => {
                domInstance.children = [];
                if(isClient) dom.dom.innerHTML = '';
            };

            let render = () => {
                clear();

                prefix = tempPrefix;
                instance.parent = domInstance.parent;
                instance.children = domInstance.children;
    
                const result = handle(dynMethod);
    
                instance.parent = oldParent;
                instance.children = previousChildrens;
                prefix = oldPrefix;

                return result
            };

            const result = render();

            pushChild(domInstance);
            
            if(result instanceof Promise) {
                return result.then(e => dynMethod);
            }

            return dynMethod;
        },
        dom(type, props, handle = () => {}) {
            if(instance.isServer) {
                pushChild(null)
                return
            }

            const previousChildrens = instance.children;
            const index = previousChildrens.length + 1;
            const oldPrefix = prefix;
            const oldParent = instance.parent
            const domInstance = {
                children: [],
                type,
                props
            };

            instance.children = domInstance.children;
            prefix = getId(type, index)

            let dom = toDOM(domInstance, prefix, oldParent)
            domInstance.parent = dom?.dom
            instance.parent = domInstance.parent
            domInstance.props.id = prefix

            const result = handle(dom);
            

            if(result instanceof Promise) {
                return result.then(e => {
                    instance.children = previousChildrens;
                    pushChild(domInstance);
                    prefix = oldPrefix
                    instance.parent = oldParent

                    return dom
                });
            }

            instance.children = previousChildrens;
            pushChild(domInstance);
            prefix = oldPrefix
            instance.parent = oldParent

            return dom;
        },
        img(src, props = {}) {
            if(instance.isServer) {
                pushChild(null)
                return
            }

            const prefix = getId('img', instance.children)
            const domInstance = {
                children: [],
                type: 'img',
                props: {
                    ...props,
                    loading: "lazy", 
                    src,
                    id: prefix
                }
            };
            let dom = toDOM(domInstance, prefix, instance.parent)
            domInstance.parent = dom?.dom
            pushChild(domInstance)
            return dom
        },
        input(type = 'text', props = {}) {
            if(instance.isServer) {
                pushChild(null)
                return
            }

            const prefix = getId('inp', instance.children)
            const domInstance = {
                children: [],
                type: 'input',
                props: {
                    ...props,
                    type,
                    id: prefix
                }
            };
            let dom = toDOM(domInstance, prefix, instance.parent)

            domInstance.parent = dom?.dom
            pushChild(domInstance)

            let model = state(null)

            if(isClient)
                dom.dom.addEventListener('input', (ev) => {
                    model.value = ev.currentTarget.value
                })

            return {
                ...dom,
                get value() {
                    return model.value
                },
                setValue(v) {
                    model.value = v
                },
                change(handle) {
                    if(isClient)
                        dom.dom.addEventListener('change', (ev) => {
                            handle(model.value, ev)
                        })
                }
            }
        },
        text(content, props = {}) {
            if(instance.isServer) {
                pushChild(null)
                return
            }

            if(typeof content === 'object') {
                if(content[symState]) {
                    watch(content, (v) => {
                        if(typeof v === 'object') {
                            v = JSON.stringify(content)
                        }
                        dom.caption(v)
                    })
                    content = content.value
                }
                else {
                    content = JSON.stringify(content)
                }
            }

            const prefix = getId('span', instance.children)
            const domInstance = {
                children: content,
                type: 'span',
                props: {
                    ...props,
                    id: prefix
                }
            };
            let dom = toDOM(domInstance, prefix, instance.parent)
            domInstance.parent = dom?.dom
            pushChild(domInstance)
            return dom
        },
        use(other, props, slot) {
            if(instance.isServer) {
                pushChild(null)
                console.log('yes')
                return
            }

            const oldSlot = instance.slot
            const previousChildrens = instance.children;
            const index = instance.children.length + 1
            const oldPrefix = prefix;
            
            prefix = getId('d', index)

            let children = []
            other.children = children
            other.setParent(instance.parent)
            other.setPrefix(prefix)
            instance.children = children

            instance.slot = slot

            const result = other.render(props, instance.context)

            return result.then(e => {
                instance.slot = oldSlot
                instance.children = previousChildrens
                prefix = oldPrefix
                pushChild({...other.instance})
            })
        }
    };

    return {
        setParent(element) {
            instance.parent = element
        },
        setPrefix(_prefix) {
            prefix = _prefix
        },
        async render(props, context = null) {
            instance.context = context ?? methods
            instance.props = props
            await builder(props, instance.context)
        },
        clear() {
            prefix = ''
            instance.children = []
        },
        get children() { return instance.children },
        set children(v) { instance.children = v },
        get instance() { return instance }
    };
};