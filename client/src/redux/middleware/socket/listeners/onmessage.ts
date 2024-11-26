import { AppDispatch } from "../../../store";
import { WebsocketMessage } from "../types/websocket.types";
import handleStatusMessageType from "./status";
import handleIOMessageStatus from "./io";

export const handleOnMessage = (event: MessageEvent, dispatch: AppDispatch) => {
  const message: WebsocketMessage = JSON.parse(event.data);
  console.log("WebSocket OnMessage:", message);

  const messageType = message.type;

  if (messageType === "gameState") {
    const platoons = message.payload.platoons;
    console.log("Platoons:", platoons);
  }
  if (messageType === "status") {
    handleStatusMessageType(message, dispatch);
  }

  if (messageType === "io") {
    handleIOMessageStatus(message, dispatch);
  }
};
