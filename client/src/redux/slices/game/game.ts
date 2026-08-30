import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import {
  GameStatus,
  GameEventType,
  ObjectiveType,
  LandingZoneType,
  FlightType,
  SoldierCard,
  ElementBuild,
} from "shared";
import type { GameOutcome } from "../../middleware/socket/types/message.types";
import axios from "axios";

export const apiBaseUrl = (): string => {
  const host = import.meta.env.VITE_SERVER_HOST || "localhost";
  const port = import.meta.env.VITE_SERVER_PORT || 4000;
  return `http://${host}:${port}`;
};

interface GameState {
  status: GameStatus;
  tick: number;
  /** Admin/observer mode: both sides act on their own strategy. */
  autonomous: boolean;
  /** Engagement feed, newest last, as broadcast by the server. */
  events: GameEventType[];
  outcome: GameOutcome | null;
  objectives: ObjectiveType[];
  landingZones: LandingZoneType[];
  /** Elements in the air. */
  flights: FlightType[];
  /** The draft board this session's players pick from. */
  roster: SoldierCard[];
  rosterLoaded: boolean;
  /** Result of the last drop-in attempt. */
  deployError: string | null;
  deploying: boolean;
  pending: boolean;
  error: string | null;
}

const initialState: GameState = {
  status: GameStatus.NOT_STARTED,
  tick: 0,
  autonomous: true,
  events: [],
  outcome: null,
  objectives: [],
  landingZones: [],
  flights: [],
  roster: [],
  rosterLoaded: false,
  deployError: null,
  deploying: false,
  pending: false,
  error: null,
};

type Control = "start" | "pause" | "reset";

/** Drive the server-side loop. The resulting state arrives over the socket. */
export const sendGameControl = createAsyncThunk<
  { status: GameStatus; tick: number },
  Control
>("game/control", async (control) => {
  const response = await axios.post(`${apiBaseUrl()}/api/game/${control}`);
  return { status: response.data.status, tick: response.data.tick };
});

/** Toggle admin mode — whether both sides act without an operator. */
export const setAutonomy = createAsyncThunk<
  { status: GameStatus; tick: number; autonomous: boolean },
  boolean
>("game/autonomy", async (enabled) => {
  const response = await axios.post(`${apiBaseUrl()}/api/game/autonomy`, {
    enabled,
  });
  return {
    status: response.data.status,
    tick: response.data.tick,
    autonomous: response.data.autonomous,
  };
});

/** Pull the draft board a player builds an element from. */
export const fetchRoster = createAsyncThunk<
  { roster: SoldierCard[]; landingZones: LandingZoneType[] }
>("game/roster", async () => {
  const response = await axios.get(`${apiBaseUrl()}/api/game/roster`);
  return response.data;
});

/** Drop in: send a build; the server puts it on a helicopter. */
export const deployElement = createAsyncThunk<
  { flightId: string },
  ElementBuild,
  { rejectValue: string }
>("game/deploy", async (build, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${apiBaseUrl()}/api/game/deploy`, build);
    return { flightId: response.data.flightId };
  } catch (err) {
    const message =
      axios.isAxiosError(err) && err.response?.data?.message
        ? String(err.response.data.message)
        : "Deployment failed";
    return rejectWithValue(message);
  }
});

/** Order a whole element to a point on the map. */
export const orderElementMove = createAsyncThunk<
  void,
  { platoonId: string; position: [number, number] },
  { rejectValue: string }
>("game/elementMove", async ({ platoonId, position }, { rejectWithValue }) => {
  try {
    await axios.post(
      `${apiBaseUrl()}/api/platoons/${platoonId}/move`,
      { position },
      { headers: { "X-Player-Id": localStorage.getItem("namejs.playerId") ?? "" } }
    );
  } catch (err) {
    const message =
      axios.isAxiosError(err) && err.response?.data?.message
        ? String(err.response.data.message)
        : "Move order failed";
    return rejectWithValue(message);
  }
});

/** Change an element's posture. */
export const orderElementStrategy = createAsyncThunk<
  void,
  { platoonId: string; strategy: string },
  { rejectValue: string }
>("game/elementStrategy", async ({ platoonId, strategy }, { rejectWithValue }) => {
  try {
    await axios.post(
      `${apiBaseUrl()}/api/platoons/${platoonId}/strategy`,
      { strategy },
      { headers: { "X-Player-Id": localStorage.getItem("namejs.playerId") ?? "" } }
    );
  } catch (err) {
    const message =
      axios.isAxiosError(err) && err.response?.data?.message
        ? String(err.response.data.message)
        : "Posture change failed";
    return rejectWithValue(message);
  }
});

/** Advance the simulation by hand while it is paused. */
export const stepGame = createAsyncThunk<
  { status: GameStatus; tick: number },
  number
>("game/step", async (ticks) => {
  const response = await axios.post(`${apiBaseUrl()}/api/game/step`, { ticks });
  return { status: response.data.status, tick: response.data.tick };
});

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    // Applied from every gameState broadcast.
    setGameStatus: (
      state,
      action: PayloadAction<{
        status: GameStatus;
        tick: number;
        events?: GameEventType[];
        autonomous?: boolean;
        outcome?: GameOutcome | null;
        objectives?: ObjectiveType[];
        landingZones?: LandingZoneType[];
        flights?: FlightType[];
      }>
    ) => {
      const p = action.payload;
      state.status = p.status;
      state.tick = p.tick;
      if (p.events) state.events = p.events;
      if (p.autonomous !== undefined) state.autonomous = p.autonomous;
      if (p.outcome !== undefined) state.outcome = p.outcome;
      if (p.objectives) state.objectives = p.objectives;
      if (p.landingZones) state.landingZones = p.landingZones;
      if (p.flights) state.flights = p.flights;
    },
    clearDeployError: (state) => {
      state.deployError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendGameControl.pending, (state) => {
        state.pending = true;
        state.error = null;
      })
      .addCase(sendGameControl.fulfilled, (state, action) => {
        state.pending = false;
        state.status = action.payload.status;
        state.tick = action.payload.tick;
      })
      .addCase(sendGameControl.rejected, (state, action) => {
        state.pending = false;
        state.error = action.error.message ?? "Game control failed";
      })
      .addCase(stepGame.fulfilled, (state, action) => {
        state.status = action.payload.status;
        state.tick = action.payload.tick;
      })
      .addCase(setAutonomy.fulfilled, (state, action) => {
        state.status = action.payload.status;
        state.tick = action.payload.tick;
        state.autonomous = action.payload.autonomous;
      })
      .addCase(fetchRoster.fulfilled, (state, action) => {
        state.roster = action.payload.roster;
        state.landingZones = action.payload.landingZones;
        state.rosterLoaded = true;
      })
      .addCase(deployElement.pending, (state) => {
        state.deploying = true;
        state.deployError = null;
      })
      .addCase(deployElement.fulfilled, (state) => {
        state.deploying = false;
      })
      .addCase(deployElement.rejected, (state, action) => {
        state.deploying = false;
        state.deployError = action.payload ?? "Deployment failed";
      })
      // A new match means a new draft board — drop the cached one and the old
      // result rather than waiting for the next broadcast to correct them.
      .addMatcher(
        (action) => action.type === "lobby/rematch/fulfilled",
        (state) => {
          state.roster = [];
          state.rosterLoaded = false;
          state.outcome = null;
          state.events = [];
          state.deployError = null;
        }
      );
  },
});

export type { GameState };
export const { setGameStatus, clearDeployError } = gameSlice.actions;
export default gameSlice.reducer;
