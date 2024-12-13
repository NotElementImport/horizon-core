export declare const getSnapshotApp: () => {
    vnode: import("../type").Primitive.ComponentNode<any>;
    elementHash: string;
    elementIndex: number;
    isHydrating: boolean;
    isDev: boolean;
    signal: {
        isSearchingSignals?: undefined;
        findedSignals?: undefined;
        shared?: undefined;
        weak?: undefined;
    } | {
        isSearchingSignals: boolean;
        findedSignals: any[];
        shared: {
            [k: string]: {
                value: any;
                signal: import("../type").Signal.Signal<any, any>;
            };
        };
        weak: any[];
    };
};
