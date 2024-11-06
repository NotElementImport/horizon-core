interface State<T> {
    value: T
}

interface IDomProps {
    [name: string]: any
    class?: string | string[] | Function
    style?: string | Function
}

interface IDomTextProps extends IDomProps {
    clamp?: number
}

interface IDomImgProps extends IDomProps {
    width?: string,
    loading?: "eager"| "lazy",
    decoding?: "sync"| "async"| "auto",
    importance?: "auto"| "high"| "low",
    height?: string,
}

interface IDomInputProps extends IDomProps {
    type?: 'text' | 'number' | 'date' | 'checkbox' | 'color' | 'radio',
}

interface IDomResponse<T extends PropertyKey> {
    readonly element: HTMLElementTagNameMap[T] 
    click(handler: (ev: MouseEvent) => void): ThisType
    rightClick(handler: (ev: MouseEvent) => void): ThisType
    update(): ThisType
    caption(text: string|object): ThisType
    removeChilds(): ThisType
    remove(): ThisType
}

interface IDynInputResponse<T> extends IDomResponse<T> {
    watch(...args: State<any>[]): void
    updateState(handle?: Function): Promise<void>
}

interface IDomInputResponse<T> extends IDomResponse<T> {
    change(handle: (value: string, ev: InputEvent) => void): ThisType
    enterKey(handle: (value: string, ev: KeyboardEvent) => void): ThisType
}

interface IComponent<T> {
    readonly meta(): any
    clear(): void
    setParent(dom: HTMLElement): void
    render(props: T, context: any): void|Promise<void>
}

type VerboseType = 'Client' | 'Server' | 'API'

interface IComponentBuilder {
    slip(slot: () => Promise<void>, errorSlot: (type: VerboseType, error: any) => void): Promise<void>
    slip(slot: () => void, errorSlot: (type: VerboseType, error: any) => void): void

    dom<T>(type: keyof HTMLElementTagNameMap | T, props: IDomProps): IDomResponse<T>
    dom<T>(type: keyof HTMLElementTagNameMap | T, props: IDomProps, slot: (r: IDomResponse<T>) => Promise<void>): Promise<IDomResponse<T>>
    dom<T>(type: keyof HTMLElementTagNameMap | T, props: IDomProps, slot: (r: IDomResponse<T>) => void): IDomResponse<T>

    dyn<T>(type: keyof HTMLElementTagNameMap | T, props: IDomProps, slot: (r: IDynInputResponse<T>) => Promise<void>): Promise<IDynInputResponse<T>>
    dyn<T>(type: keyof HTMLElementTagNameMap | T, props: IDomProps, slot: (r: IDynInputResponse<T>) => void): IDynInputResponse<T>

    div(props: IDomProps, slot: (r: IDomResponse<'div'>) => Promise<void>): Promise<IDomResponse<'div'>>
    div(props: IDomProps, slot?: (r: IDomResponse<'div'>) => void): IDomResponse<'div'>

    section(props: IDomProps, slot: (r: IDomResponse<'section'>) => Promise<void>): Promise<IDomResponse<'section'>>
    section(props: IDomProps, slot?: (r: IDomResponse<'section'>) => void): IDomResponse<'section'>

    text(label: string|number|State<any>|Function, props?: IDomTextProps): IDomResponse<'span'>
    img(src: string|State<any>|Function, props?: IDomImgProps): IDomResponse<'img'>
    input(model: State<string?>, props?: IDomInputProps, handle?: (p: IDomInputResponse<'input'>) => void): IDomInputResponse<'input'>

    onlyServer(slot: () => Promise<void>): Promise<void>
    onlyServer(slot: () => void): void

    onlyClient(slot: () => Promise<void>): Promise<void>
    onlyClient(slot: () => void): void

    use<T>(other: IComponent<T>, props: T, slot?: () => Promise<void>): Promise<void>
    use<T>(other: IComponent<T>, props: T, slot?: () => void): void

    slot(): void|Promise<void>
}

export function comp<T extends object>(handle: (props: T, p: IComponentBuilder) => void): IComponent<T>

/** State is statement of value. And help with work dynamic data. */
export function state<T>(value: T, deep?: boolean): State<T>

/** Add css style as `Link` */
export function addStyloFile(src: string): void
/** Add css style as `Style` */
export function addStyloRaw(code: string): void

export function watch<T>(object: State<T>, handle: (value: T) => void): void

interface IRefObject<T> extends State<T> {
    /** Do a things and `Trigger` for changes */
    commit(handle: Function): Promise<void>
}

interface IRefArray<T> extends IRefObject<T> {
    /** Push items into end */
    push(...v: T): void
    /** Delete items from array by index and count */
    splice(start: number, end?: number): T[]
    /** Delete items from end; And return value */
    pop(): T
    /** Delete items from start; And return value */
    shift(): T
    /** Push items into start */
    unshift(...v: T): void
    /** Shortcut for checking lenght array */
    readonly length: number
    /** Checking for validate value */
    readonly isValid: boolean
    /** Checking for is not validate value */
    readonly isNotValid: boolean
}

interface IRefPrimitive<T> extends State<T> {
    /** Checking for validate value */
    readonly isValid: boolean
    /** Checking for is not validate value */
    readonly isNotValid: boolean
}

/** Ref is power verison of State; With helpers */
export function ref<T extends number|string|boolean>(value: T): IRefPrimitive<T>
export function ref<T extends any[]>(value: T): IRefArray<T>
export function ref<T extends object>(value: T): IRefObject<T>

interface IMut<T> extends State<T> {
    /** Checking for validate value */
    readonly isValid: boolean
    /** Checking for is not validate value */
    readonly isNotValid: boolean
}

interface IMutString extends IMut<string> {
    /** Validate string as Email  */
    readonly isAsEmailValid: boolean
    /** Protect data from Injection  */
    readonly isHadHTMLTags: boolean
}

interface IMutNumber extends IMut<number> {
    /** Checking in range number  */
    inRange(start: number, end: number): boolean
    /** Check for digit lenght  */
    isDigitLen(len: number): boolean
    /** Is Even  */
    readonly isEven: boolean
    /** Is Odd  */
    readonly isOdd: boolean
}

/** String Mutate Object\
 * Using for work with Inputs and other datas to protect site
 */
export function mut(value: string): IMutString
/** Number Mutate Object\
 * Using for work with Inputs and other datas to protect site
 */
export function mut(value: number): IMutNumber