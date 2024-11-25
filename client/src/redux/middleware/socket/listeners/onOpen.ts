import { AppDispatch } from "../../../store";
import { setWebSocketConnected } from "../../../slices/websocket";

export const handleOnOpen = (dispatch: AppDispatch) => {
  console.log("WebSocket Opened ...");
  dispatch(setWebSocketConnected());
};
