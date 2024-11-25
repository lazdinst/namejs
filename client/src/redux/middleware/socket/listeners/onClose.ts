import { AppDispatch } from "../../../store";
import { setWebSocketDisconnected } from "../../../slices/websocket";

import { disconnected } from "../../../slices/api";

export const handleOnClose = (dispatch: AppDispatch) => {
  console.log("WebSocket Closed...");
  // Uncomment this if needed, but it's causing issues with strict mode
  // dispatch(disconnected());
  console.log(disconnected);
  dispatch(setWebSocketDisconnected());
};
