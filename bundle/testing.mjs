import { currentApp } from "./app.mjs";
import { signalMemoryMap } from "./stateble.mjs";
export const getSnapshotApp = () => {
    return {
        vnode: currentApp.leadComposable,
        elementHash: currentApp.hydMeta,
        elementIndex: currentApp.hydCounter - 1,
        isHydrating: currentApp.isHydrate,
        isDev: currentApp.isDev,
        signal: signalMemoryMap(),
    };
};
