export function useStack($default = []) {
    let tasks = $default;
    let isRunning = false;
    return {
        get count() { return tasks.length; },
        push(task) {
            tasks.push(task);
        },
        async spread() {
            if (isRunning)
                return;
            isRunning = true;
            const taskSize = tasks.length;
            return new Promise(resolve => {
                let completed = 0;
                const tryResolve = () => taskSize <= completed ? (isRunning = false, resolve()) : null;
                for (const task of tasks) {
                    (async () => {
                        await task();
                        completed += 1;
                        tryResolve();
                    })();
                }
            });
        },
        async run(clearAfter = false) {
            if (isRunning)
                return;
            isRunning = true;
            for (const task of tasks) {
                await task();
            }
            isRunning = false;
            if (clearAfter)
                this.clear();
        },
        clear() {
            tasks = [];
        }
    };
}
