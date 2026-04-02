"use client";

import { createContext, useContext, useState } from "react";

const P2PChatContext = createContext();

export const useP2PChat = () => {
  const context = useContext(P2PChatContext);
  if (!context) {
    throw new Error("useP2PChat must be used within a P2PChatProvider");
  }
  return context;
};

export const P2PChatProvider = ({ children }) => {
  const [isP2PChatOpen, setIsP2PChatOpen] = useState(false);

  const openP2PChat = () => setIsP2PChatOpen(true);
  const closeP2PChat = () => setIsP2PChatOpen(false);

  return (
    <P2PChatContext.Provider
      value={{
        isP2PChatOpen,
        openP2PChat,
        closeP2PChat,
      }}
    >
      {children}
    </P2PChatContext.Provider>
  );
};
