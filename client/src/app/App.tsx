import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { fetchServerStatus } from "../redux/slices/api";
import { RootState, useAppDispatch } from "../redux/store";
import { Wrapper } from "./components";
import WebSocketProvider from "./providers/WebSocketProvider";

import Map from "./Map";
import TopNavBar from "./components/TopNavBar";

function App() {
  const dispatch = useAppDispatch();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { connected, loading } = useSelector(
    (state: RootState) => state.server
  );
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRY_ATTEMPTS = 3;
  const RECONNECT_INTERVAL = 1000;

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Settings", href: "/settings" },
  ];

  useEffect(() => {
    if (!connected && !loading && retryCount < MAX_RETRY_ATTEMPTS) {
      intervalRef.current = setInterval(() => {
        dispatch(fetchServerStatus())
          .unwrap()
          .then(() => {
            setRetryCount(0);
            console.log("Connected to server");
          })
          .catch(() => {
            if (retryCount >= MAX_RETRY_ATTEMPTS && intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          });

        setRetryCount((count) => count + 1);
      }, RECONNECT_INTERVAL);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [connected, loading, retryCount, dispatch]);

  if (!connected) {
    return (
      <div>
        Connecting... Failed {retryCount} of {MAX_RETRY_ATTEMPTS}
        {retryCount >= MAX_RETRY_ATTEMPTS && (
          <div>
            Failed to connect to server
            <button onClick={() => setRetryCount(0)}>Retry</button>
          </div>
        )}
      </div>
    );
  } else {
    return (
      <WebSocketProvider>
        <Wrapper
          topNav={
            <TopNavBar
              appName="Namejs"
              logoSrc="/ring.png"
              links={navLinks}
              avatarUrl="/ring.png"
              onAvatarClick={() => console.log("Avatar clicked!")}
            />
          }
          leftPanel={<div>Left Panel Content</div>}
          rightPanel={<div>Right Panel Content</div>}
          map={<Map />}
        />
      </WebSocketProvider>
    );
  }
}

export default App;
