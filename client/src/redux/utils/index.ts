/**
 * Versioned so a cached copy of an older UI shape is ignored rather than
 * rehydrated into a store that no longer has those fields.
 */
export const UI_STORAGE_KEY = "ui.v3";

export function loadUIState() {
  try {
    const serializedState = localStorage.getItem(UI_STORAGE_KEY);
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Failed to load ui state from localStorage", err);
    return undefined;
  }
}
