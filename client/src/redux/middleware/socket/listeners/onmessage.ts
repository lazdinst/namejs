import { AppDispatch } from "../../../store";
import { WebsocketMessage } from "../types/websocket.types";
import { setPlatoons } from "../../../slices/platoons";
import { setGameStatus } from "../../../slices/game";
import { setLobby } from "../../../slices/lobby";

export const handleOnMessage = (event: MessageEvent, dispatch: AppDispatch) => {
  const message: WebsocketMessage = JSON.parse(event.data);

  if (message.type === "gameState") {
    const {
      platoons,
      status,
      tick,
      events,
      autonomous,
      outcome,
      objectives,
      landingZones,
      flights,
      lobby,
    } = message.payload;
    dispatch(setPlatoons(platoons));
    if (lobby) dispatch(setLobby(lobby));
    dispatch(
      setGameStatus({
        status,
        tick,
        events: events ?? [],
        autonomous,
        outcome: outcome ?? null,
        objectives: objectives ?? [],
        landingZones: landingZones ?? [],
        flights: flights ?? [],
      })
    );
  }
};
