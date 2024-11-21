import { Middleware } from "@reduxjs/toolkit";
import { isEqual } from "../../../utils";

const localStorageMiddleware: Middleware = ({ getState, dispatch }) => {
  console.log(dispatch);
  let previousPlannerState = getState().planner;
  let previousUIState = getState().ui;

  return (next) => (action) => {
    const result = next(action);
    const currentMasterPlannerState = getState().planner;
    const currentUIState = getState().ui;
    const cacheUIState = getState().settings.cacheUIState;

    // Planner Caching
    if (!isEqual(currentMasterPlannerState, previousPlannerState)) {
      // TODO: Debounce this
      const { ready, active_task, mission } = currentMasterPlannerState;
      const plannerState = { ready, active_task, mission };

      localStorage.setItem("planner", JSON.stringify(plannerState));
      previousPlannerState = currentMasterPlannerState;
    }

    // UI Caching
    if (cacheUIState) {
      // UI Caching
      if (!isEqual(currentUIState, previousUIState)) {
        // TODO: This needs to be debounced and needs to be a dispatched thunk
        localStorage.setItem("ui", JSON.stringify(currentUIState));
        previousUIState = currentUIState;
      }
    }

    return result;
  };
};

export default localStorageMiddleware;
