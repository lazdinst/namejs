import { Middleware } from "@reduxjs/toolkit";
import { isEqual } from "../../../utils";
import { UI_STORAGE_KEY } from "../../utils";

/**
 * Persists UI preferences across reloads. Game state is server-authoritative
 * and arrives over the socket, so none of it is cached here.
 */
const localStorageMiddleware: Middleware = ({ getState }) => {
  let previousUIState = getState().ui;

  return (next) => (action) => {
    const result = next(action);

    if (!getState().settings.cacheUIState) return result;

    const currentUIState = getState().ui;
    if (!isEqual(currentUIState, previousUIState)) {
      // TODO: debounce this and move it into a dispatched thunk.
      localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(currentUIState));
      previousUIState = currentUIState;
    }

    return result;
  };
};

export default localStorageMiddleware;
