import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: any) => {

  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {

    const newSocket = io("https://gateplatform.onrender.com");

    setSocket(newSocket);

    // join personal user room
    if (user?.userNo) {
      newSocket.emit("joinUserRoom", user.userNo);
    }

    return () => {
      newSocket.disconnect();
    };

  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};