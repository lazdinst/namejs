import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { GameStatus } from "shared";

import gameReducer, { setGameStatus } from "../redux/slices/game/game";
import platoonsReducer from "../redux/slices/platoons/platoons";
import websocketReducer from "../redux/slices/websocket/websocket";
import uiReducer from "../redux/slices/ui/ui";
import Shell from "../app/components/Shell/Shell";
import { TopBar } from "../app/components/Shell";
import { Button } from "@/components/ui/button";

const makeStore = () =>
  configureStore({
    reducer: {
      game: gameReducer,
      platoons: platoonsReducer,
      websocket: websocketReducer,
      ui: uiReducer,
    },
  });

const withStore = (ui: React.ReactElement, store = makeStore()) => {
  const result = render(<Provider store={store}>{ui}</Provider>);
  return { ...result, store };
};

describe("Shell", () => {
  it("lays out the status bar, the map, the overlay and the drawer", () => {
    withStore(
      <Shell
        topBar={<div>STATUS BAR</div>}
        map={<div>MAP</div>}
        overlay={<div>ELEMENT CARD</div>}
        drawer={<div>OPS</div>}
      />
    );

    for (const region of ["STATUS BAR", "MAP", "ELEMENT CARD", "OPS"]) {
      expect(screen.getByText(region)).toBeInTheDocument();
    }
  });

  it("starts with the ops drawer collapsed", () => {
    const { store } = withStore(
      <Shell topBar={null} map={null} overlay={null} drawer={<div>OPS</div>} />
    );

    expect(store.getState().ui.rightPanelOpen).toBe(false);
    expect(
      screen.getByRole("button", { name: /expand ops panel/i })
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("pulls the drawer open from its tab, and closes it again", () => {
    const { store } = withStore(
      <Shell topBar={null} map={null} overlay={null} drawer={<div>OPS</div>} />
    );

    fireEvent.click(screen.getByRole("button", { name: /expand ops panel/i }));
    expect(store.getState().ui.rightPanelOpen).toBe(true);
    expect(
      screen.getByRole("button", { name: /collapse ops panel/i })
    ).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(screen.getByRole("button", { name: /collapse ops panel/i }));
    expect(store.getState().ui.rightPanelOpen).toBe(false);
  });
});

describe("TopBar", () => {
  it("shows the simulation state, tick and link status", () => {
    const { store } = withStore(<TopBar />);

    expect(screen.getByText("NAMEJS")).toBeInTheDocument();
    expect(screen.getByText("DOWN")).toBeInTheDocument();

    act(() => {
      store.dispatch(setGameStatus({ status: GameStatus.RUNNING, tick: 512 }));
    });

    expect(screen.getByText("512")).toBeInTheDocument();
    expect(screen.getByText("running")).toBeInTheDocument();
  });
});

describe("shadcn button, adapted", () => {
  it("renders with the project's squared, uppercase treatment", () => {
    render(<Button>Start</Button>);
    const button = screen.getByRole("button", { name: "Start" });

    expect(button.className).toContain("uppercase");
    expect(button.className).toContain("rounded-sm");
    expect(button.className).not.toContain("shadow");
  });

  it("keeps the variant API intact", () => {
    render(
      <>
        <Button variant="outline">Pause</Button>
        <Button variant="ghost">Step</Button>
      </>
    );

    expect(screen.getByRole("button", { name: "Pause" }).className).toContain(
      "border-hairline"
    );
    expect(screen.getByRole("button", { name: "Step" }).className).toContain(
      "border-transparent"
    );
  });

  it("respects the disabled state", () => {
    render(<Button disabled>Reset</Button>);
    expect(screen.getByRole("button", { name: "Reset" })).toBeDisabled();
  });
});
