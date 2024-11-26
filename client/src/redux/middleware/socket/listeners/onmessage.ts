import { AppDispatch } from "../../../store";
import { WebsocketMessage } from "../types/websocket.types";

export const handleOnMessage = (event: MessageEvent, dispatch: AppDispatch) => {
  const message: WebsocketMessage = JSON.parse(event.data);
  console.log("WebSocket OnMessage:", message);

  const messageType = message.type;

  if (messageType === "gameState") {
    const platoons = message.payload.platoons;
    console.log("Platoons:", platoons);
    console.log(dispatch);
  }
};
