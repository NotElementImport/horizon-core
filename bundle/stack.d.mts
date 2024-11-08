export interface IStack {
    readonly count: number;
    push(task: Function): void;
    spread(): Promise<void> | void;
    run(clearAfter?: boolean): Promise<void>;
    clear(): void;
}
export declare function useStack($default?: never[]): IStack;
