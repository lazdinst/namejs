import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { LobbyState, PlatoonFaction, Loadout } from "shared";
import { apiBaseUrl } from "../game/game";

/**
 * Who this browser is. Minted once and kept, so a reload does not lose the
 * seat. Sent on every lobby call as a header.
 */
export const PLAYER_ID_KEY = "namejs.playerId";

export function playerId(): string {
  try {
    const existing = localStorage.getItem(PLAYER_ID_KEY);
    if (existing) return existing;
    const fresh = `p-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    localStorage.setItem(PLAYER_ID_KEY, fresh);
    return fresh;
  } catch {
    return `p-${Math.random().toString(36).slice(2, 12)}`;
  }
}

interface LobbySlice {
  lobby: LobbyState;
  me: string;
  /** LZ staged by clicking the map or the list, before it is confirmed. */
  pendingLandingZoneId: string | null;
  busy: boolean;
  error: string | null;
}

const initialState: LobbySlice = {
  lobby: { phase: "waiting", players: [], draftDeadline: null, taken: [] },
  me: playerId(),
  pendingLandingZoneId: null,
  busy: false,
  error: null,
};

const call = async (path: string, body?: unknown): Promise<LobbyState> => {
  try {
    const r = await axios.post(`${apiBaseUrl()}/api/lobby/${path}`, body ?? {}, {
      headers: { "X-Player-Id": playerId() },
    });
    return r.data.lobby;
  } catch (err) {
    const message =
      axios.isAxiosError(err) && err.response?.data?.message
        ? String(err.response.data.message)
        : "Lobby request failed";
    throw new Error(message);
  }
};

const thunk = <A,>(name: string, fn: (arg: A) => Promise<LobbyState>) =>
  createAsyncThunk<LobbyState, A, { rejectValue: string }>(
    `lobby/${name}`,
    async (arg, { rejectWithValue }) => {
      try {
        return await fn(arg);
      } catch (e) {
        return rejectWithValue((e as Error).message);
      }
    }
  );

export const joinLobby = thunk<PlatoonFaction>("join", (faction) => call("join", { faction }));
export const leaveLobby = thunk<void>("leave", () => call("leave"));
export const pickSoldier = thunk<string>("pick", (soldierId) => call("pick", { soldierId }));
export const unpickSoldier = thunk<string>("unpick", (soldierId) => call("unpick", { soldierId }));
export const setSoldierLoadout = thunk<{ soldierId: string; loadout: Loadout }>(
  "loadout",
  (b) => call("loadout", b)
);
export const nameElement = thunk<string>("name", (name) => call("name", { name }));
export const readyUp = thunk<void>("ready", () => call("ready"));
export const chooseLanding = thunk<string>("landing", (landingZoneId) =>
  call("landing", { landingZoneId })
);
export const resetLobby = thunk<void>("reset", () => call("reset"));
export const rematch = thunk<void>("rematch", () => call("rematch"));

const slice = createSlice({
  name: "lobby",
  initialState,
  reducers: {
    setLobby: (state, action: PayloadAction<LobbyState>) => {
      state.lobby = action.payload;
      // A staged pick only means something while zones are being chosen.
      if (action.payload.phase !== "landing") state.pendingLandingZoneId = null;
    },
    setPendingLandingZone: (state, action: PayloadAction<string>) => {
      state.pendingLandingZoneId = action.payload;
    },
    clearLobbyError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (a) => a.type.startsWith("lobby/") && a.type.endsWith("/pending"),
        (state) => { state.busy = true; state.error = null; }
      )
      .addMatcher(
        (a): a is PayloadAction<LobbyState> =>
          a.type.startsWith("lobby/") && a.type.endsWith("/fulfilled"),
        (state, action) => { state.busy = false; state.lobby = action.payload; }
      )
      .addMatcher(
        (a): a is PayloadAction<string | undefined> =>
          a.type.startsWith("lobby/") && a.type.endsWith("/rejected"),
        (state, action) => { state.busy = false; state.error = action.payload ?? "Lobby request failed"; }
      );
  },
});

export const { setLobby, clearLobbyError, setPendingLandingZone } =
  slice.actions;
export default slice.reducer;

/** This browser's seat, if it has one. */
export const selectMe = (s: { lobby: LobbySlice }) =>
  s.lobby.lobby.players.find((p) => p.id === s.lobby.me) ?? null;
