import { RootState, AppDispatch } from "../../../store";
import { handleOnOpen } from "./onOpen";
import { handleOnClose } from "./onClose";
import { handleOnError } from "./onError";
import { handleOnMessage } from "./onmessage";

export const initializeSocketListeners = (
  socket: WebSocket,
  getState: () => RootState,
  dispatch: AppDispatch
) => {
  setupSocketStateListeners(socket, getState, dispatch);
};

export const setupSocketStateListeners = (
  socket: WebSocket,
  getState: () => RootState,
  dispatch: AppDispatch
) => {
  console.log(getState);
  socket.onopen = () => handleOnOpen(dispatch);

  socket.onclose = () => handleOnClose(dispatch);

  socket.onerror = (error) => handleOnError(error);

  socket.onmessage = (event) => handleOnMessage(event, dispatch);
};
