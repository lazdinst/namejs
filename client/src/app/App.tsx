import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { fetchServerStatus } from "../redux/slices/api";
import { RootState, useAppDispatch } from "../redux/store";
import WebSocketProvider from "./providers/WebSocketProvider";
import Shell, { TopBar } from "./components/Shell";
import Mark from "./components/Mark";
import Map from "./Map";
import PlatoonPanel from "./containers/PlatoonPanel";
import Lobby from "./containers/Lobby";
import GameControls from "./containers/GameControls";

const MAX_RETRY_ATTEMPTS = 3;
const RECONNECT_INTERVAL = 1000;

/** Full-screen boot state, shown before the server answers. */
const Boot: React.FC<{ attempts: number; onRetry: () => void }> = ({
  attempts,
  onRetry,
}) => {
  const exhausted = attempts >= MAX_RETRY_ATTEMPTS;

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-background">
      <Mark size={56} />
      <span className="text-[13px] font-bold tracking-label text-foreground">
        NAMEJS
      </span>
      <div className="flex items-center gap-2">
        {!exhausted && (
          <span className="h-1.5 w-1.5 animate-pulse-dim rounded-full bg-primary" />
        )}
        <span className="label-tech">
          {exhausted
            ? "No link to simulation host"
            : `Establishing link · ${attempts}/${MAX_RETRY_ATTEMPTS}`}
        </span>
      </div>
      {exhausted && (
        <button
          type="button"
          onClick={onRetry}
          className="border border-hairline bg-card px-3 py-1 text-[12px] text-foreground transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          Retry
        </button>
      )}
    </div>
  );
};

function App() {
  const dispatch = useAppDispatch();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { connected, loading } = useSelector((state: RootState) => state.server);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!connected && !loading && retryCount < MAX_RETRY_ATTEMPTS) {
      intervalRef.current = setInterval(() => {
        dispatch(fetchServerStatus())
          .unwrap()
          .then(() => setRetryCount(0))
          .catch(() => {
            if (retryCount >= MAX_RETRY_ATTEMPTS && intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          });

        setRetryCount((count) => count + 1);
      }, RECONNECT_INTERVAL);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [connected, loading, retryCount, dispatch]);

  if (!connected) {
    return <Boot attempts={retryCount} onRetry={() => setRetryCount(0)} />;
  }

  return (
    <WebSocketProvider>
      {/* The map is not shown until the draft is done: join and draft are
          map-free screens, and the landing-zone pick is the first look. */}
      <Lobby map={<Map />}>
        <Shell
          topBar={<TopBar />}
          overlay={<PlatoonPanel />}
          drawer={<GameControls />}
          map={<Map />}
        />
      </Lobby>
    </WebSocketProvider>
  );
}

export default App;
