import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../redux/store';
import {
  connectSocket,
  disconnectSocket,
} from '../../../redux/slices/websocket';

interface WebSocketProviderProps {
  children: React.ReactNode;
}

const CONNECT_WS = true;

const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const wsConnected =
    useSelector((state: RootState) => state.websocket.connected) || 0;
  const serverConnected = useSelector(
    (state: RootState) => state.server.connected
  );
  console.log('serverConnected', serverConnected);
  console.log('wsConnected', wsConnected);

  useEffect(() => {
    if (CONNECT_WS) {
      dispatch(connectSocket());

      return () => {
        dispatch(disconnectSocket());
      };
    }
  }, []);

  if (serverConnected) {
    return children;
  }
};

export default WebSocketProvider;
