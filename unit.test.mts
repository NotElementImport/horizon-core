import { defineApp } from "./core/app.mts";
import { comp } from "./core/component.mts";

const app = defineApp({ devMode: true });

const main = comp((_, { $, text }) => {
  $("div", {}, () => {
    text("");
  });
});

console.log(await app.renderSSR(main, {}));
