export interface IStack {
    readonly count: number
    fill(tasks: Function[]): void
    while(task: Function): void
    push(task: Function): void
    spread(): Promise<void>|void
    run(clearAfter?: boolean): Promise<void>
    clear(): void
}

const symWhileTask = Symbol()
export function useStack($default = []): IStack {
    let tasks: Function[] = $default
    let isRunning: boolean = false

    return {
        get count() { return tasks.length },
        push(task: Function) {
            tasks.push(task)
        },
        while(task: Function) {
            tasks.push(() => {
                const whilePromise = new Promise<void>(async (resovle) => {
                    await task()
                    resovle()
                })
                Object.defineProperty(whilePromise, symWhileTask, { value: true })
                return whilePromise
            })
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
            let listWhile: Promise<void>[] = [];

            if(isRunning)
                return
            
            isRunning = true

            let i = 0
            while(i != tasks.length) {
                const task = tasks[i]

                const response = task()

                // @ts-ignore
                if(response && response instanceof Promise && response[symWhileTask])
                    listWhile.push(response)
                else
                    await response

                if(i == tasks.length - 1) {
                    await (new Promise<void>((resolve) => {
                        if(listWhile.length == 0) return resolve()

                        let activeWhile: number = 0
                        const toResolve = () => {
                            activeWhile -= 1
                            if(activeWhile == 0) resolve()
                        }

                        for (const promise of listWhile) {
                            if(!promise) continue
                            activeWhile ++
                            promise.then(e => toResolve())
                        }

                        listWhile = []
                    }))
                }

                i++
            }

            isRunning = false

            if(clearAfter) this.clear()
        },
        clear() {
            tasks = []
        }
    }
}