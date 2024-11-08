import { currentApp, render, useComposite } from "./app.mjs";
export function comp(slot) {
    const $composable = useComposite(null, {});
    return { slot, get composable() { return $composable; } };
}
export function mod(slot) {
    const $composable = useComposite(null, {});
    return (props = {}, $slot = () => { }) => {
        const app = currentApp;
        const stack = currentApp.stack;
        const parent = app.leadComposable;
        const oldMeta = app.hydMeta;
        const hash = app.hydMeta + `${app.hydCounter}$`;
        const scoped = {
            composable: {
                ...$composable,
                childs: [],
                dom: parent.dom
            },
            slot
        };
        const index = app.hydCounter;
        stack.push(async () => {
            app.hydCounter = app.hydCounter;
            app.hydMeta = hash;
            app.pipeTo(scoped.composable, index, parent);
            await render(app, scoped, { ...props, hash, slot: $slot });
            app.hydMeta = oldMeta;
        });
        app.hydCounter += 1;
    };
}
