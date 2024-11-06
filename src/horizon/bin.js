import draw, { isClient } from "./draw.js";

export const sComponent = Symbol('Component')

const cloneObject = (other) => {
    return { ...other }
};

let isSkip = false

export const comp = (handle) => {
    const compMeta = {
        [sComponent]: true,
        uid: '',
        children: [],
        context: null,
        dom: null,
        slot: () => {},
    };

    const genUID = (...args) => {
        let result = compMeta.uid;
        args.forEach(e => {
            if(typeof e === 'string')
                result += e.slice(0, 3)
            else
                result += e
        });
        return result;
    };

    const append = (other) => {
        compMeta.children.push(other);
    };

    const isPromise = (other) => {
        return other instanceof Promise
    };

    const beParentOther = (other, props, slot, after) => {
        const oldChildren = compMeta.children
        const oldUid = compMeta.uid
        const oldDom = compMeta.dom
        const oldSlot = compMeta.slot

        const oldOChildren = other.meta.children
        const oldOUid = other.meta.uid
        const oldODom = other.meta.dom
        const oldOSlot = other.meta.slot

        other.meta.uid = compMeta.uid;
        other.meta.children = compMeta.children;
        other.meta.uid = genUID(compMeta.children.length + 1, 'd');
        other.meta.dom = compMeta.dom;
        other.meta.slot = compMeta.slot;
        
        other.meta.slot = () => {
            const oldChildren = compMeta.children
            const oldUid = compMeta.uid
            const oldDom = compMeta.dom
            
            compMeta.uid = other.meta.uid
            compMeta.children = other.meta.children
            compMeta.uid = genUID(other.meta.children.length + 1, 'is');
            compMeta.dom = other.meta.dom

            const result = slot()

            if(isPromise(result)) {
                return result.then(e => {
                    compMeta.uid = oldUid
                    compMeta.dom = oldDom
                    compMeta.children = oldChildren
                })
            }

            compMeta.uid = oldUid
            compMeta.dom = oldDom
            compMeta.children = oldChildren
        };

        // compMeta.uid = other.meta.uid
        compMeta.dom = other.meta.dom
        compMeta.slot = other.meta.slot;

        const result = other.render(props, compMeta.context);

        if(isPromise(result)) {
            return result.then(e => {
                // other.meta.children = oldOChildren;
                other.meta.uid = oldOUid;
                other.meta.dom = oldODom;
                other.meta.slot = oldOSlot;

                compMeta.uid = oldUid
                compMeta.dom = oldDom
                compMeta.slot = oldSlot

                return after(other.meta);
            })
        }

        // other.meta.children = oldOChildren;
        other.meta.uid = oldOUid;
        other.meta.dom = oldODom;
        other.meta.slot = oldOSlot;

        compMeta.uid = oldUid
        compMeta.dom = oldDom
        compMeta.slot = oldSlot

        return after(other.meta);
    };

    const beParent = (other, handle, afterHandle) => {
        const oldChildren = compMeta.children;
        const oldUID = compMeta.uid;
        const oldDOM = compMeta.dom;
        
        compMeta.children = other.children;
        compMeta.uid = other?.props?.id ?? compMeta.uid;
        compMeta.dom = other.dom

        const after = handle();

        if(isPromise(after)) {
            return after.then(e => {
                compMeta.children = oldChildren;
                compMeta.uid = oldUID;
                compMeta.dom = oldDOM

                return afterHandle();
            })
        }

        compMeta.children = oldChildren;
        compMeta.uid = oldUID;
        compMeta.dom = oldDOM

        return afterHandle();
    };

    return {
        get meta() { return compMeta },
        clear() {
            compMeta.uid      = ''
            compMeta.children = []
        },
        setParent(dom) {
            compMeta.dom = dom
        },
        render(props, context = null) {
            // Init Draw
            if(context === null) {
                context = { 
                    ...draw({ 
                        append, 
                        beParent,
                        beParentOther,
                        genUID,
                        isPromise,
                        cloneObject,
                        get isSkip() { return isSkip },
                        get childrenCount() { return compMeta.children.length }, 
                        get currentDOM() { return compMeta.dom }
                    }),
                    get isClient() { return isClient },
                    onlyClient(slot) {
                        const oldIsSkip = isSkip;
                        isSkip = !isClient;
                        const after = slot()

                        if(isPromise(after)) {
                            return after.then(e => {
                                isSkip = oldIsSkip
                            })
                        }

                        isSkip = oldIsSkip
                        return after
                    },
                    slot() {
                        return compMeta.slot()
                    },
                    onlyServer(slot) {
                        const oldIsSkip = isSkip;
                        isSkip = isClient;
                        const after = slot()

                        if(isPromise(after)) {
                            return after.then(e => {
                                isSkip = oldIsSkip
                            })
                        }

                        isSkip = oldIsSkip
                        return after
                    },
                    slip(slot, errorSlot = () => {}) {
                        let after = null;

                        try {
                            after = slot()
                        }
                        catch(e) {
                            let type = isClient ? 'Client' : 'Server';

                            if(e?.type == 'API')
                                type = e?.type

                            console.error('Slip catch: ', {
                                where: type,
                                error: e
                            })

                            return errorSlot(type, e)
                        }

                        if(isPromise(after)) {
                            return after.catch(e => {
                                let type = isClient ? 'Client' : 'Server';

                                if(e?.type == 'API')
                                    type = e?.type

                                console.error('Slip catch: ', {
                                    where: type,
                                    error: e
                                })
                                
                                return errorSlot(type, e)
                            })
                        }
                        return after
                    },
                }
            }
            // Render Structure
            return handle(props, context)
        },
    };
};