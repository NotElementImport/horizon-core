import type { Component, Primitive, Signal } from "../type.d.ts";
import { resetBusId, useStylePrettify } from "./helpers.mjs";
import { createSharedJSON, executeSync } from "./shared.mjs";
import { IStack, useStack } from "./stack.mjs";
import {
  clearSignalHeap,
  unSignal,
  useComputed,
  useStrongRef,
  watch,
} from "./stateble.mjs";

export interface IHorizonApp {
  readonly composable: Primitive.ComponentNode<null>;
  readonly leadComposable: Primitive.ComponentNode<any>;
  readonly isHydrate: boolean;

  get hydCounter(): number;
  set hydCounter(v: number);

  get hydMeta(): string;
  set hydMeta(v: string);

  readonly isDev: boolean;

  pipe(
    composable: Primitive.ComponentNode<any>,
    parent?: Primitive.ComponentNode<any>,
  ): void;
  domPipe(
    dom: HTMLElement | Element,
    parent?: Primitive.ComponentNode<any>,
  ): void;
  domPipeTo(
    dom: HTMLElement | Element,
    index: number,
    parent?: Primitive.ComponentNode<any>,
  ): void;

  pipeTo(
    composable: Primitive.ComponentNode<any>,
    index: number,
    parent?: Primitive.ComponentNode<any>,
  ): void;
  lead(
    composable: Primitive.ComponentNode<any>,
    handle: () => Promise<void> | void,
  ): Promise<void>;

  clearHeap(): void;

  renderSSR(
    component: Component.Component,
    config?: {
      withMeta?: boolean;
      notClearAtEnd?: boolean;
      onlyString?: boolean;
      unmountAtEnd?: boolean;
    },
  ): Promise<string>;
  renderDOM(component: Component.Component): Promise<void>;
  renderComponent(component: Component.Component, props: any): Promise<void>;

  stack: IStack;
}

export const isClient = typeof document !== "undefined";

const arrayInsert = (array: any[], index: number, value: any) => {
  return [...array.slice(0, index), value, ...array.slice(index, array.length)];
};

const sCompoisteUnmounted = Symbol();
export function useComposite<K extends PropertyKey | null>(
  type: K,
  props: Record<string, any>,
  inline: boolean = false,
): Primitive.ComponentNode<K> {
  return {
    // @ts-ignore
    [sCompoisteUnmounted]: null,
    unmount(deep = true) {
      // @ts-ignore
      if (this[sCompoisteUnmounted]) {
        // @ts-ignore
        this[sCompoisteUnmounted](this);
      }

      if (deep) {
        for (const child of this.childs) {
          child.unmount();
        }
      }
      this.childs = [];
    },
    type,
    dom: null as any,
    props,
    inline,
    childs: [],
  };
}

export let currentApp: IHorizonApp = null as any;

export function defineApp(conifg: {
  devMode?: boolean;
} = {}): IHorizonApp {
  const $app = useComposite(null, {});

  let stack = useStack();

  let currentComposable: Primitive.ComponentNode<any> = $app;

  let hydrateCounter = 0;
  let hydrateMeta = "$";
  let isHydrate = false;

  const $instance: IHorizonApp = {
    clearHeap() {
      hydrateCounter = 0;
      hydrateMeta = "$";
      currentComposable = $app;
      $app.dom = null as any;
      resetBusId();
      clearSignalHeap();
    },
    get isHydrate() {
      return isHydrate;
    },
    get isDev() {
      return conifg.devMode ?? false;
    },

    get stack() {
      return stack;
    },
    set stack(v) {
      stack = v;
    },

    get composable() {
      return $app;
    },
    get leadComposable() {
      return currentComposable;
    },

    get hydCounter() {
      return hydrateCounter;
    },
    set hydCounter(v) {
      hydrateCounter = v;
    },

    get hydMeta() {
      return hydrateMeta;
    },
    set hydMeta(v) {
      hydrateMeta = v;
    },

    async lead(composable, handle) {
      const prev = currentComposable;

      currentComposable = composable;
      await handle();
      currentComposable = prev;
    },

    pipe(composable, parent?) {
      if (parent) {
        return parent.childs.push(composable);
      }
      currentComposable.childs.push(composable);
    },

    domPipe(dom, parent?) {
      if (!isClient) return;

      if (parent && parent.dom) {
        return parent.dom.appendChild(dom);
      } else if (currentComposable.dom) {
        currentComposable.dom.appendChild(dom);
      }
    },

    domPipeTo(dom, index, parent?) {
      if (!isClient) return;

      const to = parent ? parent.dom : currentComposable.dom;

      if (to && index >= to.childNodes.length) {
        return to.appendChild(dom);
      } else if (to) {
        to.insertBefore(
          dom,
          to.children[index],
        );
      }
    },

    pipeTo(composable, index, parent?) {
      const to = parent ? parent.childs : currentComposable.childs;

      if (index >= to.length) {
        return (parent ? parent.childs : currentComposable.childs).push(
          composable,
        );
      }

      if (parent) {
        parent.childs = arrayInsert(parent.childs, index, composable);
      }
      currentComposable.childs = arrayInsert(
        currentComposable.childs,
        index,
        composable,
      );
    },

    async renderSSR(component, config = {}) {
      if (!(config.onlyString ?? false)) {
        await render($instance, component);
      }
      let ssrMeta = "";

      if (config.withMeta ?? false) {
        ssrMeta +=
          `<script id="ssr-meta-object" type="application/json">${createSharedJSON()}</script>`;
      }

      const response = ssrMeta + toDomString(component.composable);

      if (!config.notClearAtEnd) {
        if (config.unmountAtEnd ?? false) {
          component.composable.unmount();
        } else {
          component.composable.childs = [];
        }

        component.composable.dom = null as any;
        component.composable.props = {};

        $instance.clearHeap();
      }

      return response;
    },

    async renderDOM(component) {
      if (!isClient) {
        throw new Error("Horizon: RenderDOM work only in client side");
      }

      isHydrate = true;
      const ssrMeta = document.getElementById("ssr-meta-object");
      if (ssrMeta) {
        const ssrMetaObject = JSON.parse(ssrMeta.innerHTML);
        executeSync(ssrMetaObject.data, ssrMetaObject.cacheControl);
      }
      await render($instance, component);
      isHydrate = false;
    },

    async renderComponent(comp: Component.Component, props?: any) {
      await render($instance, comp, props);
    },
  };

  currentApp = $instance;
  return $instance;
}

async function render<T extends Record<string, any>>(
  app: IHorizonApp,
  comp: Component.Component<T>,
  props?: T,
) {
  const oldStack = app.stack;
  app.stack = useStack();

  if (!props) {
    app.pipe(comp.composable);
  }

  await app.lead(comp.composable, async () => {
    const $nodes = {
      inject(handle: () => unknown) {
        app.stack.while(handle);
      },
      implement(item: any) {
        item = unSignal(item);

        if (item) {
          if (typeof item == "object" && "composable" in item) {
            $nodes.use(item);
          } else if (typeof item == "function") {
            item();
          } else {
            $nodes.text(item);
          }
        }
      },
      onUnmount(handle: () => unknown) {
        const parent = app.leadComposable;
        // @ts-ignore
        parent[sCompoisteUnmounted] = handle;
      },
      slot(args: any = {}) {
        const stack = app.stack;
        const parent = app.leadComposable;
        const initMeta = app.hydMeta + app.hydCounter + "slt";
        const myCounter = app.hydCounter;
        stack.push(async () => {
          const currentMeta = app.hydMeta;
          const oldCounter = app.hydCounter;
          app.hydCounter = myCounter;
          app.hydMeta = initMeta;
          await app.lead(parent, async () => {
            await (props as any).slot(args);
          });
          app.hydMeta = currentMeta;
          app.hydCounter = oldCounter;
        });
        app.hydCounter += 1;
      },
      use(
        other: Component.Component,
        props: object = {},
        slot: () => void = () => {},
      ) {
        const stack = app.stack;
        const parent = app.leadComposable;
        const oldMeta = app.hydMeta;
        const hash = app.hydMeta + `${app.hydCounter}$`;

        const scoped = {
          composable: {
            ...other.composable,
            childs: [],
            dom: app.leadComposable.dom,
          },
          slot: other.slot,
        };

        const index = app.hydCounter;
        stack.push(async () => {
          const oldCounter = app.hydCounter;
          app.hydCounter = index;
          app.hydMeta = hash;
          await render(app, scoped, props = { ...props, hash, slot });
          app.hydMeta = oldMeta;
          app.hydCounter = oldCounter;
          app.pipeTo(scoped.composable, index, parent);
        });
        app.hydCounter += 1;
      },
      $(...args: any) {
        const stack = app.stack;
        const parent = app.leadComposable;
        let domParent = app.leadComposable.dom;

        const oldMeta = app.hydMeta;
        const hash = app.hydMeta + `${app.hydCounter}${args[0].slice(0, 3)}`;
        const props = { ...(args[1] ?? {}), hash };

        if (props["$parent"]) {
          if (!isClient) return (app.hydCounter += 1, void 0);
          domParent = props.$parent;
          delete props["$parent"];
        }

        const vDom = toDom(args[0], props);
        const node = useComposite(args[0], props);
        node.dom = vDom.dom;

        const index = app.hydCounter;
        const mountRender = async () => {
          if (isClient) {
            vDom.dom.innerHTML = "";
          }

          if (props["#unmountWatching"] ?? true) {
            node.unmount(true);
          } else {
            node.childs = [];
          }

          if (args[2]) {
            await app.lead(node, async () => {
              const oldCounter = app.hydCounter;
              app.hydCounter = 0;
              app.hydMeta = hash;
              await args[2](vDom);
              app.hydMeta = oldMeta;
              app.hydCounter = oldCounter;
            });
          }
        };

        if (props["#watching"]) {
          for (const state of props["#watching"]) {
            watch(state, () => {
              const oldStack = app.stack;
              app.stack = stack;

              stack.push(async () => {
                await mountRender();
              });

              stack.run(true).then(() => app.stack = oldStack);
            }, { deep: props["#deepWatching"] ?? false });
          }
        }

        stack.push(async () => {
          await mountRender();

          app.pipeTo(node, index, parent);
          // @ts-ignore
          app.domPipeTo(vDom.dom, index, { dom: domParent });
        });
        app.hydCounter += 1;

        return vDom;
      },
      text(...args: any) {
        const stack = app.stack;
        const hash = app.hydMeta + `${app.hydCounter}txt`;
        const props = { ...args[1], html: args[0], hash };
        if (typeof props.html == "function") {
          props.html = useComputed(props.html);
        }
        const vDom = toDom("span", props);

        const parent = app.leadComposable;
        const index = app.hydCounter;
        stack.push(async () => {
          const node = useComposite("span", props);
          node.dom = vDom.dom;
          app.pipeTo(node, index, parent);
          app.domPipeTo(vDom.dom, index, parent);
        });

        app.hydCounter += 1;
        return vDom;
      },
      img(...args: any) {
        const stack = app.stack;
        const hash = app.hydMeta + `${app.hydCounter}txt`;
        const props = { ...args[1], src: args[0], hash };
        const vDom = toDom("img", props);

        const parent = app.leadComposable;
        const index = app.hydCounter;
        stack.push(async () => {
          const node = useComposite("img", props, true);
          node.dom = vDom.dom;
          app.pipeTo(node, index, parent);
          app.domPipeTo(vDom.dom, index, parent);
        });

        app.hydCounter += 1;
        return vDom;
      },
      input($props: Record<string, any>) {
        const stack = app.stack;
        const hash = app.hydMeta + `${app.hydCounter}inp`;

        const props = { ...$props, hash };
        const vDom = toDom<HTMLInputElement>("input", props);

        if ($props["#model"] && isClient) {
          // @ts-ignore
          const type =
            ({ "checkbox": 1, "number": 2 })[$props.type ?? "text"] ?? 0;

          let model = $props["#model"];
          useStrongRef(model, (raw) => {
            switch (type) {
              case 0:
                {
                  vDom.dom.value = raw;
                }
                break;
              case 1:
                {
                  vDom.dom.checked = raw;
                }
                break;
              case 2:
                {
                  vDom.dom.valueAsNumber = raw;
                }
                break;
            }
          });

          vDom.dom.addEventListener(
            ($props["#lazy"] ?? false) ? "change" : "input",
            (e) => {
              switch (type) {
                // @ts-ignore
                case 0:
                  {
                    model.value = e.target.value;
                  }
                  break;
                // @ts-ignore
                case 1:
                  {
                    model.value = e.target.checked;
                  }
                  break;
                // @ts-ignore
                case 2:
                  {
                    model.value = e.target.valueAsNumber;
                  }
                  break;
              }
            },
          );
        }

        const parent = app.leadComposable;
        const index = app.hydCounter;
        stack.push(async () => {
          const node = useComposite("input", props, true);
          node.dom = vDom.dom;
          app.pipeTo(node, index, parent);
          app.domPipeTo(vDom.dom, index, parent);
        });

        app.hydCounter += 1;
        return vDom;
      },
      div(...args: any) {
        return $nodes.$("div", ...args);
      },
      dyn(
        follower: Signal.Signal<any>[],
        slot: () => void | Promise<void>,
        config: any = {},
      ) {
        const stack = app.stack;
        const parent = app.leadComposable;

        const keepCounter = app.hydCounter;
        const hash = app.hydMeta + `${app.hydCounter}dyn`;
        const props = { style: "display: contents;", hash };
        const vDom = toDom("dynamic" as any, props);
        const node = useComposite("dynamic" as any, props);
        node.dom = vDom.dom;

        const dynamicRender = async () => {
          if (isClient) {
            vDom.dom.innerHTML = "";
          }

          if (config.unmount ?? true) {
            node.unmount(config.deepUnmount ?? true);
          } else {
            node.childs = [];
          }

          await app.lead(node, async () => {
            const oldCounter = app.hydCounter;
            app.hydCounter = keepCounter;
            app.hydMeta = hash;
            await slot();
            app.hydCounter = oldCounter;
          });
        };

        for (const state of follower) {
          watch(state, () => {
            const oldStack = app.stack;
            app.stack = stack;

            stack.push(async () => {
              await dynamicRender();
            });

            stack.run(true).then(() => app.stack = oldStack);
          }, { deep: config.deepWatch ?? false });
        }

        const index = app.hydCounter;
        stack.push(async () => {
          await dynamicRender();

          app.pipeTo(node, index, parent);
          app.domPipeTo(vDom.dom, index, parent);
        });

        app.hydCounter += 1;

        return vDom;
      },
    };

    await comp.slot(props as any, $nodes as any);
  });

  const stack = app.stack;
  await stack.run(true);
  app.stack = oldStack;
  if (!props) {
    app.hydCounter = 0;
  }
}

function toDomString(comp: Primitive.ComponentNode<any>) {
  let result = "";

  const layer = (comp: Primitive.ComponentNode<any>) => {
    if (!comp.type) {
      return comp.childs.forEach((e) => layer(e));
    }

    result += `<${comp.type}`;

    for (const [name, value] of Object.entries(comp.props)) {
      if (name == "html" || name[0] == "@" || name[0] == "#" || !value) {
        continue;
      } else if (name == "style") {
        result += ` ${name}="${useStylePrettify(unSignal(value))}"`;
      } else if (name == "class") {
        const unpacked = unSignal(value);
        result += ` ${name}="${
          Array.isArray(unpacked) ? value.join(" ") : unpacked
        }"`;
      } else {
        result += ` ${name}="${unSignal(value)}"`;
      }
    }
    result += `>`;

    if (comp.inline) {
      return;
    }

    if (comp.props.html) {
      result += unSignal(comp.props.html);
    } else {
      for (const composable of comp.childs) {
        layer(composable);
      }
    }

    result += `</${comp.type}>`;
  };

  layer(comp);

  return result;
}

function toDom<T extends HTMLElement>(
  type: keyof HTMLElementTagNameMap,
  props: Record<string, any>,
) {
  let dom: T = null as any;

  const eventExist: Record<string, boolean> = {};

  const eventSet = (name: string, handle: Function) => {
    if (name.includes(".")) {
      let [actualName, behaviour] = name.split(".");
      const mainHandle = handle;

      switch (behaviour) {
        case "stop":
          {
            handle = (ev: Event) => {
              mainHandle(ev);
              ev.stopImmediatePropagation();
            };
          }
          break;
        case "prevent":
          {
            handle = (ev: Event) => {
              ev.preventDefault();
              mainHandle(ev);
            };
          }
          break;
        case "enter":
          {
            handle = (ev: KeyboardEvent) => {
              if (ev.key == "Enter") {
                mainHandle(ev);
              }
            };
          }
          break;
        case "shift":
          {
            handle = (ev: KeyboardEvent) => {
              if (ev.shiftKey) {
                mainHandle(ev);
              }
            };
          }
          break;
        case "ctrl":
          {
            handle = (ev: KeyboardEvent) => {
              if (ev.ctrlKey) {
                mainHandle(ev);
              }
            };
          }
          break;
      }

      name = actualName;
    }

    if (name in eventExist) {
      return;
    }

    switch (name) {
      case "click":
        {
          dom.addEventListener("click", handle as any);
        }
        break;
      case "hover":
        {
          dom.addEventListener("mouseenter", handle as any);
        }
        break;
      case "lost":
        {
          dom.addEventListener("mouseleave", handle as any);
        }
        break;
      case "change":
        {
          dom.addEventListener("change", handle as any);
        }
        break;
      case "input":
        {
          dom.addEventListener("input", handle as any);
        }
        break;
      case "press":
        {
          dom.addEventListener("keypress", handle as any);
        }
        break;
    }
  };

  let isHydrate = true,
    alive = true;

  const isDeleted = () => {
    if (!isHydrate && alive && dom.getRootNode() != document) {
      return alive = !alive, true;
    }
    return !alive;
  };

  if (isClient) {
    dom = document.querySelector(`[hash="${props.hash}"]`) ??
      document.createElement(type) as T;

    for (const [key, value] of Object.entries(props)) {
      if (key[0] == "#") continue;

      if (key == "html") {
        useStrongRef(value, (v, unwatch) => {
          if (isDeleted()) return unwatch();
          dom.innerHTML = v;
        });
      } else if (key[0] == "@") {
        eventSet(key.slice(1), value);
      } else if (key == "style") {
        useStrongRef(value, (v) => {
          dom.setAttribute("style", useStylePrettify(v));
        }, true);
      } else if (key == "class") {
        useStrongRef(value, (v) => {
          dom.setAttribute("class", Array.isArray(v) ? v.join(" ") : v);
        }, true);
      } else if (key == "readonly" || key == "disabled") {
        useStrongRef(value, (v) => {
          if (v) {
            dom.setAttribute(key, "");
          } else {
            dom.removeAttribute(key);
          }
        }, true);
      } else {
        useStrongRef(value, (v, unwatch) => {
          if (isDeleted()) return unwatch();
          v != null ? dom.setAttribute(key, v) : dom.removeAttribute(key);
        });
      }
    }
  }

  isHydrate = false;

  const vDom = {
    get isAlive() {
      return !isDeleted();
    },
    dom,
    click(handle: Function) {
      if (isClient) eventSet("click", handle);
    },
    hover(handle: Function) {
      if (isClient) {
        eventSet(
          "hover",
          (ev: any) => ev.currentTarget == ev.target ? handle(ev) : null,
        );
      }
    },
    lost(handle: Function) {
      if (isClient) {
        eventSet(
          "lost",
          (ev: any) => ev.currentTarget == ev.target ? handle(ev) : null,
        );
      }
    },
  };

  return vDom;
}
