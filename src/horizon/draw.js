import { isState, watch } from "./utils.js";

export const isClient = typeof document !== 'undefined';

const toDOM = (struct, parentDOM) => {
    /** @type { HTMLElement } */
    let element = globalThis[struct.props.id]

    if(!element && parentDOM) {
        element = document.createElement(struct.type);

        for (let [name, value] of Object.entries(struct.props ?? {})) {
            if(Array.isArray(value)) {
                value = value.join(' ')
            }
            else if(typeof value == 'function') {
                value = value()
            }

            element.setAttribute(name, value);
        }

        if(!Array.isArray(struct.children)) {
            if(typeof struct.children === 'function')
                element.innerHTML = struct.children()
            else
                element.innerHTML = struct.children
        }

        if(parentDOM.childNodes.length - 1 >= struct.props.index )
            parentDOM.insertBefore(element, parentDOM.childNodes[struct.props.index]);
        else
            parentDOM.append(element);
    }

    const flags = {
        hasClick: false,
        hasRightClick: false,
    };

    const statement = {
        element,
        update() {
            for (let [name, value] of Object.entries(struct.props ?? {})) {
                if(Array.isArray(value)) {
                    value = value.join(' ')
                }
                else if(typeof value == 'function') {
                    value = value()
                }
    
                element.setAttribute(name, value);
            }
    
            if(!Array.isArray(struct.children)) {
                if(typeof struct.children === 'function')
                    element.innerHTML = struct.children()
                else
                    element.innerHTML = struct.children
            }

            return statement;
        },
        click(handle) {
            if(!isClient || flags.hasClick) {
                return statement;
            }

            element.addEventListener('click', handle);
            flags.hasClick = true;

            return statement;
        },
        rightClick(handle) {
            if(!isClient || flags.hasRightClick) {
                return statement;
            }

            element.addEventListener('contextmenu', (ev) => {
                ev.preventDefault();
                handle(ev);
            });

            flags.hasRightClick = true;

            return statement;
        },
        caption(text) {
            if(isClient) {
                if(typeof text === 'object')
                    text = JSON.stringify(text)

                element.innerHTML = text
            }

            struct.children = text

            return statement;
        },
        removeChilds() {
            if(isClient)
                element.innerHTML = ''

            return statement;
        },
        remove() {
            if(isClient) element.remove();
            return statement;
        }
    };

    return statement;
};

export default (p) => {
    const { append, beParent, beParentOther, genUID, isPromise } = p

    const childrenCount = () => p.childrenCount;
    const currentDOM    = () => p.currentDOM;
    const isSkip        = () => p.isSkip;

    const drawble = {
        use(other, props, slot = () => {}) {
            return beParentOther(
                other,
                props,
                slot,
                (child) => {}
            )
        },
        dyn(type, props, slot = () => {}) {
            if(isSkip()) {
                append(null);
                return null;
            }

            const domMeta = {
                type: type,
                props: {
                    index: childrenCount(),
                    ...props
                },
                children: [],
            };

            domMeta.props.id = genUID(childrenCount() + 1, type);

            let dom = toDOM(domMeta, currentDOM());
            domMeta.dom = dom?.element;

            const flags = {
                hadWatch: false
            }

            const statement = {
                ...dom,
                clear() {
                    domMeta.children = [];
                    if(isClient) dom.element.innerHTML = '';
                },
                render() {
                    statement.clear();
                    return beParent(
                        domMeta, 
                        () => slot(statement),
                        () => dom
                    );
                },
                watch(...args) {
                    if(flags.hadWatch) return

                    args.forEach(item => {
                        watch(item, () => {
                            statement.updateState()
                        })
                    })

                    flags.hadWatch = true
                },
                async updateState(handle = () => {}) {
                    await handle();
                    dom.update();
                    statement.render();
                }
            };

            const after = statement.render()

            append(domMeta);

            return after;
        },
        dom(type, props, slot = () => {}) {
            if(isSkip()) {
                append(null);
                return null;
            }

            const domMeta = {
                type: type,
                props: {
                    index: childrenCount(),
                    ...props
                },
                children: [],
            };

            domMeta.props.id = genUID(childrenCount() + 1, type);

            let dom = toDOM(domMeta, currentDOM());
            domMeta.dom = dom?.element;

            const after = beParent(
                domMeta, 
                () => slot(dom),
                () => dom
            );

            append(domMeta);

            return after;
        },
        div(props, slot = () => {}) {
            return drawble.dom('div', props, slot);
        },
        section(props, slot = () => {}) {
            return drawble.dom('section', props, slot);
        },
        text(content, props = {}) {
            if(isSkip()) {
                append(null);
                return null;
            }

            if(isState(content)) {
                let value = content.value;
                watch(content, (v) => {
                    value = v;
                    dom.update();
                })
                content = () => value;
            }
 
            let style = props.style ?? ''

            if(props.clamp) {
                props['data-textbox'] = true;
                style += `-webkit-line-clamp: ${props.clamp}`;
                delete props.clamp;
            }

            const domMeta = {
                type: 'span',
                props: {
                    style,
                    index: childrenCount(),
                    id: genUID(childrenCount() + 1, 'span'),
                    ...props
                },
                children: content
            };

            let dom = toDOM(domMeta, currentDOM());
            domMeta.dom = dom?.element;

            append(domMeta);
            return dom
        },
        input(model, props, pslot = () => {}) {
            if(isSkip()) {
                append(null);
                return null;
            }

            if(!isState(model)) {
                throw new Error('input model not state');
            }

            const domMeta = {
                type: 'input',
                props: {
                    index: childrenCount(),
                    id: genUID(childrenCount() + 1, 'span'),
                    ...props
                },
                children: []
            };

            let dom = toDOM(domMeta, currentDOM());
            domMeta.dom = dom?.element;

            append(domMeta);

            if(isClient) {
                dom.element.value = model.value;

                watch(model, (v) => {
                    dom.element.value = model.value
                })

                dom.element.addEventListener('input', (ev) => {
                    model.value = ev.currentTarget.value;
                });
            }

            let flags = {
                hadChange: false,
                hadEnterKey: false
            };

            dom.change = (handle) => {
                if(!isClient || flags.hadChange) return dom;

                dom.element.addEventListener('chane', (ev) => {
                    handle(model.value, ev);
                });

                flags.hadChange = true;
                return dom;
            };

            dom.enterKey = (handle) => {
                if(!isClient || flags.hadEnterKey) return dom;

                dom.element.addEventListener('keydown', (ev) => {
                    if(ev.key === 'Enter') {
                        handle(model.value, ev);
                        ev.currentTarget.blur();
                    }
                });

                flags.hadEnterKey = true;
                return dom;
            };

            if(isClient) pslot(dom)
            return dom
        },
        img(src, props = {}) {
            if(isSkip()) {
                append(null);
                return null;
            }

            if(isState(src)) {
                let value = src.value;
                watch(src, (v) => {
                    value = v;
                    dom.update();
                })
                src = () => value;
            }
 
            const domMeta = {
                type: 'img',
                props: {
                    src,
                    loading: 'lazy',
                    decoding: 'async',
                    importance: 'low',
                    index: childrenCount(),
                    id: genUID(childrenCount() + 1, 'span'),
                    ...props
                },
                children: []
            };

            let dom = toDOM(domMeta, currentDOM());
            domMeta.dom = dom?.element;

            append(domMeta);
            return dom
        }
    }
    return drawble
};