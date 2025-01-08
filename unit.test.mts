import { defineApp } from "./core/app.mts";
import { comp } from "./core/component.mts";

const app = defineApp();

const main = comp((_, { $, text }) => {
  $(`article`, {}, () => {
    text(() => `Hello world!`);
  });
});

console.log(await app.renderSSR(main, {}));

