import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../redux/store";
import {
  connectSocket,
  disconnectSocket,
} from "../../../redux/slices/websocket";

interface WebSocketProviderProps {
  children: React.ReactNode;
}

const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const wsConnected = useSelector(
    (state: RootState) => state.websocket.connected
  );

  useEffect(() => {
    dispatch(connectSocket());
    return () => {
      dispatch(disconnectSocket());
    };
  }, [dispatch]);

  if (!wsConnected) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse-dim rounded-full bg-primary" />
          <span className="label-tech">Opening telemetry stream</span>
        </span>
      </div>
    );
  }

  return <>{children}</>;
};

export default WebSocketProvider;
