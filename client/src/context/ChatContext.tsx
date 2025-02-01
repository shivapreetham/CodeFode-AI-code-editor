"use client";
import React, { createContext, useState, ReactNode } from "react";

interface Message {
  sender: string;
  text: string;
  timestamp: any;
}

interface ChatContextType {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export const ChatContext = createContext<ChatContextType>({
  messages: [],
  setMessages: () => {},
});

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);

  return (
    <ChatContext.Provider value={{ messages, setMessages }}>
      {children}
    </ChatContext.Provider>
  );
};
