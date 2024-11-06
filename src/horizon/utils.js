import { sComponent } from "./bin.js";

const sState = Symbol('State')
const sWatchers = Symbol('State Watchers')

const deepProxy = (object) => {
    let   handler = () => {}
    const watch = (_handler) => handler = _handler
    const proxify = (struct) => {
        return new Proxy(struct, {
            get(t, p, r) {
                return Reflect.get(t, p, r)
            },
            set(t, p, v, r) {
                const data =Reflect.set(t, p, v, r)
                if(p != 'length')
                    handler(object, { property: p, value: v })

                if(typeof v == 'object')
                    v = proxify(v)

                return data
            },
            has(t, p) {
                return p in t
            }
        })
    };
    let buffer = proxify(object)
    const rec = (struct) => {
        for (const name in struct) {
            if(typeof struct[name] === 'object') {
                struct[name] = proxify(struct[name])
            }
        }
    };
    rec(buffer)
    return [buffer, watch, (v) => {
        buffer = proxify(v)
    }]
};

export const isState = (object) => {
    return object[sState] ? true : false
};

export const state = (value, deep = false) => {
    if(deep) {
        let [original, watch, reset] = deepProxy(value)

        watch((v) => {
            proxy.trigger()
        })

        const proxy = {
            [sState]: true,
            [sWatchers]: [],
            trigger() {
                proxy[sWatchers].forEach(f => {
                    f(original)
                })
            },
            get value() {
                return original
            },
            set value(v) {
                reset(v)
            }
        };

        return proxy
    }

    const proxy = {
        [sState]: true,
        [sWatchers]: [],
        get value() {
            return value
        },
        set value(v) {
            value = v
            proxy[sWatchers].forEach(e => {
                e(value)
            })
        }
    };

    return proxy;
};

export const ref = (value) => {
    if(typeof value == 'object') {
        const buffer = state(value, true);

        Object.defineProperty(buffer, 'isValid', {
            get() { return buffer.value.length > 0 }
        });

        Object.defineProperty(buffer, 'isNotValid', {
            get() { return buffer.value.length <= 0 }
        });

        Object.defineProperty(buffer, 'lenght', {
            get() { return buffer.value.length }
        });

        return Object.assign(buffer, {
            push(...v) {
                buffer.value.push(...v);
            },
            splice(start, end = 1) {
                buffer.value.splice(start, end);
                buffer.trigger();
            },
            pop() {
                const value = buffer.value.pop();
                buffer.trigger();
                return value;
            },
            shift() {
                const value = buffer.value.shift();
                buffer.trigger();
                return value;
            },
            unshift(...v) {
                buffer.value.unshift(...v);
            },
            async commit(handle) {
                await handle();
                buffer.trigger();
            },
        });
    }

    const buffer = state(value);
    let isValid = () => buffer.value ? true : false;

    if(typeof value === 'number') {
        isValid = () => !isNaN(buffer.value);
    }
    else if(typeof value === 'boolean') {
        isValid = () => typeof buffer.value !== 'undefined';
    }

    Object.defineProperty(buffer, 'isValid', {
        get() { return isValid() }
    });

    Object.defineProperty(buffer, 'isNotValid', {
        get() { return !isValid() }
    });

    return buffer;
};

export const mut = (value) => {
    const proxy = {
        [sState]: true,
        [sWatchers]: [],
        get value() {
            return value
        },
        set value(v) {
            value = v
            proxy[sWatchers].forEach(e => {
                e(value)
            })
        },
        get isNull() {
            return typeof value === 'undefined' || Number.isNaN(value)
        }
    };

    let isValid = () => value ? true : false;

    if(typeof value === 'number') {
        proxy.inRange = (start, end) => {
            return value >= start && value <= end;
        };

        proxy.isDigitLen = (len) => {
            return `${value}`.length === len;
        };

        Object.defineProperty(proxy, 'isEven', {
            get() {
                return value % 2 === 0;
            }
        });

        Object.defineProperty(proxy, 'isOdd', {
            get() {
                return value % 2 === 1;
            }
        });

        isValid = () => !Number.isNaN(value);
    }
    else if(typeof value === 'string') {
        Object.defineProperty(proxy, 'isAsEmailValid', {
            get() {
                return value.split('@')?.[1]?.includes('.') ?? false
            }
        });

        Object.defineProperty(proxy, 'isHadHTMLTags', {
            get() {
                return value.includes('</') || value.includes('<input') || value.includes('<img') || value.includes('<video') || value.includes('<iframe')
            }
        });

        isValid = () => value.trim() ? true : false;
    }

    Object.defineProperty(proxy, 'isValid', {
        get() {
            return isValid();
        }
    });

    Object.defineProperty(proxy, 'isNotValid', {
        get() {
            return !isValid();
        }
    });

    return proxy;
};

export const watch = (object, handle) => {
    object[sWatchers].push(handle);
};

export const toHTML = (meta) => {
    const recursive = (object) => {
        if(object == null) {
            return ''
        }

        let response = '';

        if(!object[sComponent]) {
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
                response += recursive(item);
            }
        }
        else {
            if(typeof object.children == 'function')
                response += object.children();
            else
                response += object.children;
        }

        if(!object[sComponent] && object.type != 'img' && object.type != 'input') {
            response += `</${object.type}>`;
        }

        return response
    };

    return recursive(meta)
};