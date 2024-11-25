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
    console.log("Mounting WebSocketProvider");

    dispatch(connectSocket());

    return () => {
      console.log("Unmounting WebSocketProvider, cleaning up...");
      dispatch(disconnectSocket());
    };
  }, [dispatch]);

  if (!wsConnected) {
    console.log("WebSocket not connected, rendering null");
    return <>connecting</>;
  }

  return <>{children}</>;
};

export default WebSocketProvider;
