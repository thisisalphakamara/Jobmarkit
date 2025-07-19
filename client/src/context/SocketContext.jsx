import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AppContext } from "./AppContext";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children, backendUrl }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!backendUrl) {
      console.log("SocketProvider: backendUrl not available yet");
      return;
    }

    console.log(
      "SocketProvider: Creating Socket.IO connection to:",
      backendUrl
    );

    try {
      // Create Socket.IO connection
      const socketInstance = io(backendUrl, {
        transports: ["websocket", "polling"],
        autoConnect: true,
        timeout: 5000, // 5 second timeout
      });

      // Connection event handlers
      socketInstance.on("connect", () => {
        console.log("Socket.IO connected:", socketInstance.id);
        setIsConnected(true);
      });

      socketInstance.on("disconnect", () => {
        console.log("Socket.IO disconnected");
        setIsConnected(false);
      });

      socketInstance.on("connect_error", (error) => {
        console.error("Socket.IO connection error:", error);
        setIsConnected(false);
      });

      setSocket(socketInstance);

      // Cleanup on unmount
      return () => {
        if (socketInstance) {
          socketInstance.disconnect();
        }
      };
    } catch (error) {
      console.error("Error creating Socket.IO connection:", error);
      setIsConnected(false);
    }
  }, [backendUrl]);

  // Function to join a chat room
  const joinChat = (applicationId) => {
    if (socket && isConnected) {
      socket.emit("join-chat", applicationId);
      console.log("Joined chat room:", applicationId);
    }
  };

  // Function to leave a chat room
  const leaveChat = (applicationId) => {
    if (socket && isConnected) {
      socket.emit("leave-chat", applicationId);
      console.log("Left chat room:", applicationId);
    }
  };

  // Function to send a message
  const sendMessage = (messageData) => {
    if (socket && isConnected) {
      socket.emit("new-message", messageData);
      console.log("Sent message via Socket.IO:", messageData);
    }
  };

  // Function to start typing indicator
  const startTyping = (data) => {
    if (socket && isConnected) {
      socket.emit("typing-start", data);
    }
  };

  // Function to stop typing indicator
  const stopTyping = (data) => {
    if (socket && isConnected) {
      socket.emit("typing-stop", data);
    }
  };

  // Function to mark message as read
  const markMessageAsRead = (data) => {
    if (socket && isConnected) {
      socket.emit("message-read", data);
    }
  };

  const value = {
    socket,
    isConnected,
    joinChat,
    leaveChat,
    sendMessage,
    startTyping,
    stopTyping,
    markMessageAsRead,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
