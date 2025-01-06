import { useDebounceCallback, useFriction } from "./core/composables.mts";
import { useSignal } from "./core/stateble.mts";

const search = useSignal<string>("");

useFriction([search], {
  debounce: 600,
  setup() {
    console.log("Test friction");
  },
});

search.value = "Test";
