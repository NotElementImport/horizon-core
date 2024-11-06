interface ICompDOM {
    dom: HTMLElement
    caption(text: string): void
    click(handle: (ev: MouseEvent) => void): void
    remove(): void
    update(): void
}

interface ICompState extends ICompDOM {
    setState(handle: Function): void
    watch(...variables: {value: any}[]): void
}

interface ICompInput extends ICompDOM {
    readonly value: string
    setValue(v: string): void
    change(handle: (value: string, ev: InputEvent) => void): void
}
type IInputType = 'text' | 'number' | 'date' | 'checkbox' | 'color' | 'range'

interface ICompBuilder {
    isClient: boolean
    
    onlyClient(handle: () => Promise<void>): Promise<void>
    onlyClient(handle: () => void): void

    onlyServer(handle: () => Promise<void>): Promise<void>
    onlyServer(handle: () => void): void

    slot(): Promise<void>|void

    use<T>(other: CompBase<T>, props: T, slot?: () => (void|Promise<void>)): Promise<void>

    text(label: any, props?: {}): ICompDOM
    img(src: string, props?: {}): ICompDOM
    input(src: IInputType, props?: {}): ICompInput

    dom(type: string, props: Record<string, any>): ICompDOM
    dom(type: string, props: Record<string, any>, handle: (s: ICompDOM) => Promise<void>): Promise<ICompDOM>
    dom(type: string, props: Record<string, any>, handle: (s: ICompDOM) => void): ICompDOM

    dyn(type: string, props: Record<string, any>, handle: (s: ICompState) => Promise<void>): Promise<ICompState>
    dyn(type: string, props: Record<string, any>, handle: (s: ICompState) => void): ICompState
}

interface CompBase<T> {
    setParent(p: HTMLElement): void
    render(props: T, context?: object): Promise<void>
    clear(): void
    readonly children: object[]
    readonly instance: object
}

export function comp<T extends Record<string, any>>(builder: (props: T, options: ICompBuilder) => void): CompBase<T>
export function toHTML(instance: CompBase<any>['instance']): string
export function state<T extends any>(value: T): { value: T }
export function watch<T extends any>(value: T, handle: (newValue: T) => void ): void
export function stylo(css: string): void
export function addStylo(path: string): void