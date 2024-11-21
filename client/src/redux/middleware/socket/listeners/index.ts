import { RootState, AppDispatch } from "../../../store";
import { WebsocketMessage } from "../types/websocket.types";

import {
  setWebSocketConnected,
  setWebSocketDisconnected,
} from "../../../slices/websocket";

import { disconnected } from "../../../slices/api";
import handleStatusMessageType from "./status";
import handleIOMessageStatus from "./io";

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
  socket.onopen = () => {
    console.log("Websocket Opened ...");
    dispatch(setWebSocketConnected());
  };

  socket.onclose = () => {
    console.log("Websocket Closed...");
    dispatch(disconnected());
    dispatch(setWebSocketDisconnected());
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  socket.onmessage = (event) => {
    const message: WebsocketMessage = JSON.parse(event.data);
    console.log("Websocket OnMessage:", message);
    const messageType = message.type;

    if (messageType === "status") {
      handleStatusMessageType(message, dispatch);
    }

    if (messageType === "io") {
      handleIOMessageStatus(message, dispatch);
    }
  };
};
