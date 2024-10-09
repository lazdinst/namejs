import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { fetchServerStatus } from "../redux/slices/api";
import { RootState, useAppDispatch } from "../redux/store";

function App() {
  const dispatch = useAppDispatch();
  const { connected, loading } = useSelector(
    (state: RootState) => state.server
  );
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRY_ATTEMPTS = 3;
  const RECONNECT_INTERVAL = 3000;

  useEffect(() => {
    if (!connected && !loading && retryCount < MAX_RETRY_ATTEMPTS) {
      const intervalId = setInterval(() => {
        dispatch(fetchServerStatus())
          .unwrap()
          .then(() => {
            setRetryCount(0);
          })
          .catch(() => {
            if (retryCount >= MAX_RETRY_ATTEMPTS) {
              clearInterval(intervalId);
            }
          });

        setRetryCount((count) => count + 1);
      }, RECONNECT_INTERVAL);

      return () => clearInterval(intervalId);
    }
  }, [connected, loading, retryCount, dispatch]);

  return <div>{connected ? "Connected" : "Not connected"}</div>;
}

export default App;
