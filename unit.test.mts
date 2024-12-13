import { defineApp } from "./bundle/app.mjs";
import { comp, mod } from "./bundle/component.mjs";

const app = defineApp();

const BetweenTest = mod((_, { $, slot }) => {
  $("section", {}, () => {
    $("div", {});
    slot({});
    $("div", {});
  });
});

const main = comp((_, { text }) => {
  BetweenTest({}, () => {
    text("Test");
  });
});

console.log(await app.renderSSR(main));
