<<<<<<< HEAD
# Frontend framework `Horizon`

```
This is an early build of the project, created for introductory purposes. If you want to participate in the development of the project, you can go to the project in the github
```

### Create first app (Browser render)

Before creating an application, you need to prepare an html file
```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Horizon app</title>
    </head>
    <body>
        <div id="app"></div>
        <script type="module" src="./index.js"></script>
    </body>
</html>
```

File index.js:

```ts
import { defineApp, render } from "horizon-core";
import { comp } from "horizon-core/component";

const app = defineApp()

const mainComponent = comp((_, { text, div }) => {
    div({}, () => {
        text('Hello world!')
    })
})

mainComponent.composable.dom = document.body.querySelector('#app') 
    ?? document.body

render(app, mainComponent)
```

### Create first app (Render to string)

```ts
import { defineApp, render, toDomString } from "horizon-core";
import { comp } from "horizon-core/component";

const app = defineApp()

const mainComponent = comp((_, { text, div }) => {
    div({}, () => {
        text('Test message')
    })
})

await render(app, mainComponent)

console.log(toDomString(mainComponent.composable))
/* <div hash="$0div"><span hash="$0div0txt">Test message</span></div> */
```

### Signal (aka Reactivity)

Simply example with counter

```ts
import { defineApp, render } from "horizon-core";
import { comp } from "horizon-core/component";
import { useSignal } from "horizon-core/state";

const app = defineApp()

const mainComponent = comp((_, { text, $ }) => {
    const counter = useSignal(
        0, { asRaw: value => `Counter: ${value}` }
    )

    $('button', {
        '@click': () => counter.value++
    }, () => {
        text(counter)
    })
})

mainComponent.composable.dom = document.body.querySelector('#app') 
    ?? document.body

render(app, mainComponent)
```

### Using Vite (npm)

Creating vite app with `vanilla-ts` template

```sh
npm create vite@latest horizon-app -- --template vanilla-ts
```
Install `horizon-core`
```sh
# Installing vite dependencies
npm i
# Installing horizon-core
npm i horizon-core
```

And edit `src/main.ts` file
```ts
import { defineApp, render } from "horizon-core";
import { comp } from "horizon-core/component";
import { useSignal } from "horizon-core/state";

const app = defineApp()

const mainComponent = comp((_, { text, $ }) => {
    const counter = useSignal(
        0, { asRaw: value => `Counter: ${value}` }
    )

    $('button', {
        '@click': () => counter.value++
    }, () => {
        text(counter)
    })
})

mainComponent.composable.dom = document.body.querySelector('#app') 
    ?? document.body

render(app, mainComponent)
```
Launch `npm run dev`
=======
<h1>
    Horizon
    $\color{#dba661}{\textsf{NEXT}}$ 
</h1>

> [!WARNING]
> Work In Progress

A Front-end Web Framework with support SSR, and States

### Setup:
```
Clone rep:
git clone https://github.com/NotElementImport/HorizonNEXT.git


Enter a folder:
cd HorizonNEXT
```
>>>>>>> d653044218dac6477fd73e2421ea855b2857dede
