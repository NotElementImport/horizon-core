const symWhileTask = Symbol();
export function useStack($default = []) {
    let tasks = $default;
    let isRunning = false;
    return {
        get count() { return tasks.length; },
        push(task) {
            tasks.push(task);
        },
        while(task) {
            tasks.push(() => {
                const whilePromise = new Promise(async (resovle) => {
                    await task();
                    resovle();
                });
                Object.defineProperty(whilePromise, symWhileTask, { value: true });
                return whilePromise;
            });
        },
        fill($tasks) {
            tasks = $tasks;
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
            let listWhile = [];
            if (isRunning)
                return;
            isRunning = true;
            let i = 0;
            while (i != tasks.length) {
                const task = tasks[i];
                const response = task();
                if (response && response instanceof Promise && response[symWhileTask])
                    listWhile.push(response);
                else
                    await response;
                if (i == tasks.length - 1) {
                    await (new Promise((resolve) => {
                        if (listWhile.length == 0)
                            return resolve();
                        let activeWhile = 0;
                        const toResolve = () => {
                            activeWhile -= 1;
                            if (activeWhile == 0)
                                resolve();
                        };
                        for (const promise of listWhile) {
                            if (!promise)
                                continue;
                            activeWhile++;
                            promise.then(e => toResolve());
                        }
                        listWhile = [];
                    }));
                }
                i++;
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
