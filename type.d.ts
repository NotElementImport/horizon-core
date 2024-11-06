export namespace Signal {
    interface Signal<T, K = T> {
        value: T
        asRaw: K
    }

    type ProxySignal<T extends LikeProxy> = T

    interface IWeakRef<T> {
        value(): T
        set(v: T): void
        path: string
        pathIndex: number
        signal: Signal<T>|null
    }

    interface SignalSetup<T> {
        key?: string
        get?: () => T
        set?: (v: any) => T|void
        asRaw?: (v: T) => any
    }
    
    interface SignalProxySetup<T extends object|any[]> {
        get?(target: T, p: string|symbol): unknown
        set?(target: T, p: string|symbol, value: T): void
        has?(target: T, p: string|symbol): boolean
    }
}

export namespace Props {
    type WithSignal<T> = T extends Signal.Signal<T> ? Signal.Signal<T>['asRaw'] : K
}

export namespace Primitive {
    type LikeProxy<T extends Record<string, any> = Record<string, any>> = T|T[]

    interface ComponentNode<K extends PropertyKey|null> {
        type: K
        dom: HTMLElement
        props: Record<string|symbol, any>
        inline: boolean
        childs: ComponentNode<any>[]
    }
}

export namespace Composable {
    type ColorSheme = 'light'|'dark'
}

export namespace Component {
    interface Component<P extends Record<string, any> = {}> {
        readonly composable: Primitive.ComponentNode<null>
        slot: CompSlot<P>
    }

    type Module<P extends Record<string, any> = {}> =
        (props?: P, slot?: () => void) => void

    interface AtomResponse {
        dom: HTMLElement
        click(handle: (ev: MouseEvent) => void|Promise<void>): INodeData
        hover(handle: (ev: MouseEvent) => void|Promise<void>): INodeData
        lost(handle:  (ev: MouseEvent) => void|Promise<void>): INodeData
    }

    interface IList {
        deep?: boolean
    }

    interface AtomBasicConfig {
        style?: Props.WithSignal<CSSStyleDeclaration|{}|string>
        class?: Props.WithSignal<string[]>
        id?:    Props.WithSignal<string|number>
    }

    interface AtomList {
        $(type: keyof HTMLElementTagNameMap, props?: AtomBasicConfig, slot?: (node: AtomResponse) => void): AtomResponse
        img(src: Props.WithSignal<string>, props: AtomBasicConfig): AtomResponse
        div(props: AtomBasicConfig, slot?: (node: AtomResponse) => void): AtomResponse
        slide(firstStage: Component.Slot, secondStage: Component.Slot): { dom: HTMLElement, withTimer(sec: number): void, toMain(): void, toSecond(): void }
        text(content: Props.WithSignal<unknown>, props?: AtomBasicConfig): AtomResponse
        use<T extends object>(other: IComponent<T>, props?: T, slot?: () => void): void
        slot(): void
        dyn(follower: Props.WithSignal<any>[], handle: () => void|Promise<void>): void
        // list<T>(item: LikeState<T[]>, config: IList, handle: (item: T) => void|Promise<void>): void
    }

    type ComponentHandler<P> = (props: P, atoms: AtomList) => void

    type Slot = () => void
}