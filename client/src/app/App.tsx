import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { fetchServerStatus } from "../redux/slices/api";
import { RootState, useAppDispatch } from "../redux/store";
import { Wrapper } from "./components";
// import WebSocketProvider from "./providers/WebSocketProvider";

import Map from "./Map";
import TopNavBar from "./components/TopNavBar";

function App() {
  const dispatch = useAppDispatch();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [searchResults, setSearchResults] = useState<string | null>(null);
  const { connected, loading } = useSelector(
    (state: RootState) => state.server
  );
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRY_ATTEMPTS = 3;
  const RECONNECT_INTERVAL = 3000;

  const handleSearch = (query: string) => {
    // Placeholder search logic
    setSearchResults(`Searching for "${query}"...`);
    console.log("Search query:", query);
    console.log(searchResults);
  };

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

  // Placeholder for WebSocket integration
  // if (connected) {
  //   return (
  //     <WebSocketProvider>
  //       <div>Connected</div>
  //     </WebSocketProvider>
  //   );
  // }
  // return (
  //   <div>
  //     Connecting... Failed {retryCount} of {MAX_RETRY_ATTEMPTS}
  //     {retryCount >= MAX_RETRY_ATTEMPTS && (
  //       <div>
  //         Failed to connect to server
  //         <button onClick={() => setRetryCount(0)}>Retry</button>
  //       </div>
  //     )}
  //   </div>
  // );

  return (
    <>
      <Wrapper
        topNav={
          <TopNavBar
            appName="Namejs"
            logoSrc="/ring.png"
            links={navLinks}
            onSearch={handleSearch}
            avatarUrl="/ring.png"
            onAvatarClick={() => console.log("Avatar clicked!")}
          />
        }
        leftPanel={<div>Left Panel Content</div>}
        rightPanel={<div>Right Panel Content</div>}
        map={<Map />}
      />
    </>
  );
}

export default App;
