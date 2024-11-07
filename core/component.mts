import { Component, Props } from "../type"
import { currentApp, render, useComposite } from "./app.mjs"

export function comp<P extends object, S extends object>(
    slot: Component.ComponentHandler<P, S>
): Component.Component<P, S> {
    const $composable = useComposite(null, {})
    return { slot, get composable() { return $composable } }
}

export function mod<P extends object, S extends object>(
    slot: Component.ComponentHandler<P, S>
): Component.Module<P, S> {
    const $composable = useComposite(null, {})

    return (props: P = {} as P, $slot: Function = () => {}) => {
        const app = currentApp
        const stack = currentApp.stack

        const parent = app.leadComposable
        const oldMeta = app.hydMeta
        const hash    = app.hydMeta + `${app.hydCounter}$`

        const scoped = {
            composable: {
                ...$composable,
                childs: [],
                dom: parent.dom
            },
            slot
        }

        const index = app.hydCounter
        stack.push(async () => {
            app.hydCounter = app.hydCounter
            app.hydMeta = hash
            app.pipeTo(scoped.composable, index, parent)
       
            await render(app, scoped, { ...props, hash, slot: $slot })

            app.hydMeta = oldMeta

        })
        app.hydCounter += 1
    }
}