export interface IStack {
    readonly count: number
    fill(tasks: Function[]): void
    push(task: Function): void
    spread(): Promise<void>|void
    run(clearAfter?: boolean): Promise<void>
    clear(): void
}

export function useStack($default = []): IStack {
    let tasks: Function[] = $default
    let isRunning: boolean = false

    return {
        get count() { return tasks.length },
        push(task: Function) {
            tasks.push(task)
        },
        fill($tasks) {
            tasks = $tasks
        },
        async spread(): Promise<void> {
            if(isRunning)
                return

            isRunning = true
            const taskSize = tasks.length
            return new Promise(resolve => {
                let completed = 0
                const tryResolve = () =>
                    taskSize <= completed ? (isRunning = false, resolve()) : null

                for (const task of tasks) {
                    (async () => {
                        await task()
                        completed += 1
                        tryResolve()
                    })()
                }
            })
        },
        async run(clearAfter = false) {
            if(isRunning)
                return
            isRunning = true
            for (const task of tasks) {
                await task()
            }
            isRunning = false

            if(clearAfter) this.clear()
        },
        clear() {
            tasks = []
        }
    }
}