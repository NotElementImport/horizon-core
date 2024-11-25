export namespace Signal {
    interface Signal<T, K = T> {
        value: T
        unsafe: T
        asRaw: K
    }

    interface Shared<T, K = T> extends Signal<T, K> {}

    type ProxySignal<T extends LikeProxy> = T

    interface IWeakRef<T> {
        value(): T
        set(v: T): void
        path: string
        pathIndex: number
        signal: Signal<T>|null
    }
    
    interface SignalConfig<T, K> {
        devExpose?: string
        key?: string
        asRaw?: (v: T) => K
        onSet?: (v: T) => void
        onInit?: (signal: Signal.Signal<T, K>) => void 
    }

    interface SharedConfig<T, K> extends SignalConfig<T, K> {
        key: string
    }

    interface SignalProxySetup<T extends object|any[]> {
        get?(target: T, p: string|symbol): unknown
        set?(target: T, p: string|symbol, value: T): void
        has?(target: T, p: string|symbol): boolean
    }
}

export namespace Props {
    type OrSignal<T extends unknown> = T | Signal.Signal<T, any>
    type CSS = Props.OrSignal<string|CSS.Style>
    type CSS = Props.OrSignal<string|{}>
}

export namespace Primitive {
    type LikeProxy<T extends Record<string, any> = Record<string, any>> = T|T[]

    interface ComponentNode<K extends PropertyKey|null> {
        unmount(deep?: boolean): void
        type: K
        dom: HTMLElement
        props: Record<string|symbol, any>
        inline: boolean
        childs: ComponentNode<any>[]
    }
}

export namespace Fetching {
    type URL = string|{path: string, query?: Record<string, unknown>, pathParams?: Record<string, unknown>}|globalThis.URL

    interface RequestInit<T = unknown> extends globalThis.RequestInit {
        method?: 'GET'|'POST'|'PUT'|'DELETE'|'PATCH'|'OPTIONS'
        type?: 'json'|'text'|'arrayBuffer'|'blob'
        immediate?: boolean
        defaultValue?: T
        cacheKey?: string
        cacheControl?: HorizonFetchCacheControl
    }

    interface HorizonFetch<T = unknown> {
        rawData: Promise<T>
        response: Signal.Signal<T|null>
        status: Signal.Signal<number>
        error: Signal.Signal<boolean>
        fetching: Signal.Signal<boolean>
        restart(): Promise<T>
    }

    interface CacheControlConfig {
        on?: 'client'|'server'|'both'
    }

    interface HorizonFetchCacheControl {
        write(key: string, data: unknown): void
        read(key: string): unknown|undefined
        forget(key: string): boolean
        forgetAll(startsWith?: string): void
    }
}

export namespace Composable {
    type ColorSheme = 'light'|'dark'
}

export namespace Component {
    interface Component<P extends Record<string, any> = {}, S extends Record<string, any> = {}> {
        readonly composable: Primitive.ComponentNode<null>
        slot: CompSlot<P>
    }

    type Module<P extends Record<string, any> = {}, S extends Record<string, any> = {}> =
        (props?: P, slot?: (agrs: S) => void) => void

    interface AtomResponse {
        dom: HTMLElement
        click(handle: (ev: MouseEvent) => void|Promise<void>): INodeData
        hover(handle: (ev: MouseEvent) => void|Promise<void>): INodeData
        lost(handle:  (ev: MouseEvent) => void|Promise<void>): INodeData
    }

    interface IList {
        deep?: boolean
    }

    interface AtomClickEventConfig {
        /**
         * Event Listener `click`
         */
        '@click'?: (ev:MouseEvent) => unknown
        /**
         * Event Listener `click` with `preventDefault()` modificator
         */
        '@click.prevent'?: (ev:MouseEvent) => unknown
        /**
         * Event Listener `click` with `stopPropagation()` modificator
         */
        '@click.stop'?: (ev:MouseEvent) => unknown 
    }

    interface AtomHoverEventConfig {
        /**
         * Event Listener `hover`
         */
        '@hover'?: (ev:MouseEvent) => unknown
        /**
         * Event Listener `hover` with `preventDefault()` modificator
         */
        '@hover.prevent'?: (ev:MouseEvent) => unknown
        /**
         * Event Listener `hover` with `stopPropagation()` modificator
         */
        '@hover.stop'?: (ev:MouseEvent) => unknown 
    }

    interface AtomLostEventConfig {
        /**
         * Event Listener `lost`
         */
        '@lost'?: (ev:MouseEvent) => unknown
        /**
         * Event Listener `lost` with `preventDefault()` modificator
         */
        '@lost.prevent'?: (ev:MouseEvent) => unknown
        /**
         * Event Listener `lost` with `stopPropagation()` modificator
         */
        '@lost.stop'?: (ev:MouseEvent) => unknown 
    }

    interface AtomChangeEventConfig {
        /**
         * Event Listener `change`
         */
        '@change'?: (ev:MouseEvent) => unknown
        /**
         * Event Listener `change` with `preventDefault()` modificator
         */
        '@change.prevent'?: (ev:MouseEvent) => unknown
        /**
         * Event Listener `change` with `stopPropagation()` modificator
         */
        '@change.stop'?: (ev:MouseEvent) => unknown 
    }

    interface AtomInputEventConfig {
        /**
         * Event Listener `input`
         */
        '@input'?: (ev:MouseEvent) => unknown
        /**
         * Event Listener `input` with `preventDefault()` modificator
         */
        '@input.prevent'?: (ev:MouseEvent) => unknown
        /**
         * Event Listener `input` with `stopPropagation()` modificator
         */
        '@input.stop'?: (ev:MouseEvent) => unknown 
    }

    interface AtomKeypressEventConfig {
        /**
         * Event Listener `keypress`
         */
        '@press'?: (ev:MouseEvent) => unknown
        /**
         * Event Listener `keypress` with `enter` key
         */
        '@press.enter'?: (ev:MouseEvent) => unknown
        /**
         * Event Listener `keypress` with `shift` key
         */
        '@press.shift'?: (ev:MouseEvent) => unknown
        /**
         * Event Listener `keypress` with `ctrl` key
         */
        '@press.ctrl'?: (ev:MouseEvent) => unknown
    }

    interface AtomBasicConfig {
        /** tag `style` attribute */
        style?: Props.OrSignal<CSS.Style|string>
        /** tag `class` attribute */
        class?: Props.OrSignal<string[]>
        /** tag `id` attribute */
        id?:    Props.OrSignal<string|number>
        /** `innerHTML` attribute in element */
        html?:  Props.OrSignal<any>
    }

    type AtomConfig = AtomBasicConfig 
        & AtomClickEventConfig
        & AtomHoverEventConfig
        & AtomLostEventConfig
        & AtomKeypressEventConfig

    type AtomImgConfig = AtomConfig & {
        alt?: string
        decoding?: 'sync'|'async'|'auto'
        fetchpriority?: 'high'|'low'|'auto'
        loading?: 'lazy'|'eager'
    }

    type Autocomplete = 'on'|'off'|'section-*'|'shipping'|'billing'|'home'|'work'|'mobile'|'fax'|'page'|
        'tel-country-code'|'tel-national'|'tel-area-code'|'tel-local'|'tel'|'tel-extension'|'email'|'impp'|'name'|'honorific-prefix'|
        'given-name'|'additional-name'|'family-name'|'honorific-suffix'|'nickname'|'username'|'new-password'|'current-password'|'one-time-code'|
        'organization-title'|'organization'|'street-address'|'country'|'country-name'|'postal-code'|'cc-name'|'cc-given-name'|'cc-additional-name'|
        'cc-family-name'|'cc-number'|'cc-exp'|'cc-exp-month'|'cc-exp-year'|'cc-csc'|'cc-type'|'transaction-currency'|'transaction-amount'|'language'|
        'bday'|'bday-day'|'bday-month'|'bday-year'|'sex'|'url'|'photo'

    type AtomInputConfig = AtomConfig & AtomChangeEventConfig & AtomInputEventConfig & {
        '#model'?: Signal.Signal<any>
        '#lazy'?: boolean
        type?: 'checkbox'|'text'|'number'|'password'|'date'|'datetime-local'|'search'|'tel'|'time'|'url'|'week'|'month'|'color'|'file'|'radio'|'range'
        maxlength?: Props.OrSignal<number|string>
        minlength?: Props.OrSignal<number|string>
        max?: Props.OrSignal<number|string>
        min?: Props.OrSignal<number|string>
        step?: Props.OrSignal<number|string>
        pattern?: Props.OrSignal<number|string>
        placeholder?: Props.OrSignal<number|string>
        readonly?: Props.OrSignal<boolean>
        required?: Props.OrSignal<boolean>
        disabled?: Props.OrSignal<boolean>
        size?: Props.OrSignal<number|string>
        autocomplete?: Props.OrSignal<Autocomplete>
        autocomplete?: Props.OrSignal<string>
    }

    interface AtomList<S extends Record<string, any>> {
        inject(handle: () => unknown): void
        onUnmount(handle: () => void): void
        $(type: keyof HTMLElementTagNameMap, props?: AtomConfig, slot?: (node: AtomResponse) => void): AtomResponse
        img(src: Props.OrSignal<string>, props?: AtomImgConfig): AtomResponse
        input(props?: AtomInputConfig): AtomResponse
        div(props: AtomConfig, slot?: (node: AtomResponse) => void): AtomResponse
        text(content: Props.OrSignal<unknown>, props?: AtomConfig): AtomResponse
        
        use<T extends object, S extends object>(other: Component.Component<T, S>, props?: T, slot?: (args: S) => void): void
        slot(args: S): void
        dyn(follower: Props.OrSignal<any>[], handle: () => void|Promise<void>, config?: { deepUnmount?: boolean, unmount?: boolean }): void
    }

    type ComponentHandler<P, S> = (props: P, atoms: AtomList<S>) => void

    type Slot = () => void
}

export namespace CSS {
    type SizeType = `em`|`vw`|'lvh'|'lvw'|`vh`|`dvh`|`rem`|`px`|`%`|'cap'|'calc()'|'min(,)'|'max(,)'|'max-content'|'min-content'|'fit-content'|'auto'
    type AnyType  = 'inherit'|'unset'|'initial'|'var()'

    type BLinearGradient = 'linear-gradient()'
        | 'linear-gradient(to left top, blue, red)'
        | 'linear-gradient(to left bottom, blue, red)'
        | 'linear-gradient(to right top, blue, red)'
        | 'linear-gradient(to right bottom, blue, red)'
        | 'linear-gradient(0deg, blue, red)'
        | 'linear-gradient(.25turn, blue, 50%, red)'

    type BRadialGradient = 'radial-gradient()'
        | 'radial-gradient(blue, red)'
        | 'radial-gradient(closest-side, blue, red)'
        | 'radial-gradient(circle at center, blue, red)'

    type ColorMix = 'color-mix()'
        | 'color-mix(in srgb, white, black 50%)'
        | 'color-mix(in srgb-linear, white, black 50%)'
        | 'color-mix(in display-p3, white, black 50%)'
        | 'color-mix(in a98-rgb, white, black 50%)'
        | 'color-mix(in prophoto-rgb, white, black 50%)'
        | 'color-mix(in rec2020, white, black 50%)'
        | 'color-mix(in lab, white, black 50%)'
        | 'color-mix(in oklab, white, black 50%)'
        | 'color-mix(in xyz, white, black 50%)'
        | 'color-mix(in xyz-d50, white, black 50%)'
        | 'color-mix(in xyz-d65, white, black 50%)'
        | 'color-mix(in hsl longer hue, white, black 50%)'
        | 'color-mix(in hsl shorter hue, white, black 50%)'
        | 'color-mix(in hsl increasing hue, white, black 50%)'
        | 'color-mix(in hsl decreasing hue, white, black 50%)'
        | 'color-mix(in lch longer hue, white, black 50%)'
        | 'color-mix(in lch shorter hue, white, black 50%)'
        | 'color-mix(in lch increasing hue, white, black 50%)'
        | 'color-mix(in lch decreasing hue, white, black 50%)'

    type Colors = 'rgb(0,0,0)'|'rgba(0,0,0,1.0)'|'hsl(hue, saturation, lightness)'|'hsla(hue, saturation, lightness, alpha)'
        |'hwb(hue white black)'
        |'hwba(hue white black alpha)'
        | ColorMix

    type Timing = '0ms'|'0s';

    interface Style extends CSSStyleDeclaration {
        colorScheme: AnyType|'dark'|'light'|'dark light'|'light dark'|'only light'|'only dark'
        colorScheme: string
        
        animation: AnyType|'animation: name duration timing-function delay iteration-count direction fill-mode'
        animation: string
        
        display: AnyType|'none'|'inline'|'block'|'inline-block'|'flex'|'flexbox'|'inline-flex'|'contents'|'grid'|'table'
        flexDirection: AnyType|'row'|'column'|'column-reverse'|'row-reverse'
        
        flex: AnyType
        flex: string
        
        width: AnyType|SizeType
        width: string

        height: AnyType|SizeType
        height: string

        maxWidth: AnyType|SizeType
        maxWidth: string

        minWidth: AnyType|SizeType
        minWidth: string

        maxHeight: AnyType|SizeType
        maxHeight: string

        minHeight: AnyType|SizeType
        minHeight: string

        aspectRatio: AnyType|'1/1'|'16/9'|'21/9'|'9/16'|'9/21'|'4/3'|'3/4'|'/'
        aspectRatio: string

        margin: AnyType|'auto'|SizeType
        margin: string

        marginBlock: AnyType|'auto'|SizeType
        marginBlock: string

        marginBlockStart: AnyType|'auto'|SizeType
        marginBlockStart: string

        marginBlockEnd: AnyType|'auto'|SizeType
        marginBlockEnd: string

        marginInline: AnyType|'auto'|SizeType
        marginInline: string

        marginInlineStart: AnyType|'auto'|SizeType
        marginInlineStart: string

        marginInlineEnd: AnyType|'auto'|SizeType
        marginInlineEnd: string

        marginLeft: AnyType|'auto'|SizeType
        marginLeft: string

        marginRight: AnyType|'auto'|SizeType
        marginRight: string

        marginTop: AnyType|'auto'|SizeType
        marginTop: string

        marginBottom: AnyType|'auto'|SizeType
        marginBottom: string

        position: AnyType|'absolute'|'relative'|'fixed'|'static'|'sticky'

        background: AnyType|BLinearGradient|BRadialGradient|'url("")'|ColorMix
        background: string

        backgroundColor: AnyType|ColorMix
        backgroundColor: string

        top: AnyType|SizeType
        top: string
        
        left: AnyType|SizeType
        left: string

        bottom: AnyType|SizeType
        bottom: string

        right: AnyType|SizeType
        right: string

        transitionBehavior: AnyType|'allow-discrete'|'normal'
        transitionBehavior: string

        transitionDuration: AnyType|Timing
        transitionDuration: string

        transitionProperty: AnyType|'all'|'none'
        transitionProperty: string

        transitionProperty: AnyType|'all'|'none'
        transitionProperty: string

        transitionTimingFunction: AnyType|'ease-in'|'ease-in-out'|'ease-out'|'steps(16)'|'step-start'|'step-end'|'linear'|'ease'|'cubic-bezier(x1, y1, x2, y2)'
        transitionTimingFunction: string

        padding: AnyType|SizeType
        padding: string

        paddingBlock: AnyType|SizeType
        paddingBlock: string

        paddingBlockStart: AnyType|SizeType
        paddingBlockStart: string

        paddingBlockEnd: AnyType|SizeType
        paddingBlockEnd: string

        paddingInline: AnyType|SizeType
        paddingInline: string

        paddingInlineStart: AnyType|SizeType
        paddingInlineStart: string

        paddingInlineEnd: AnyType|SizeType
        paddingInlineEnd: string

        paddingTop: AnyType|SizeType
        paddingTop: string

        paddingBottom: AnyType|SizeType
        paddingBottom: string

        paddingLeft: AnyType|SizeType
        paddingLeft: string

        paddingRight: AnyType|SizeType
        paddingRight: string

        textAlign: AnyType|'center'|'left'|'right'|'end'|'start'

        borderRadius: AnyType|SizeType
        borderRadius: string
    }
}