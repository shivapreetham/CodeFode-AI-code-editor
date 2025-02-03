import React, { useState, useEffect, useContext } from "react";
import { ACTIONS } from "@/app/helpers/Actions";
import Avatar from "react-avatar";
import { ChatContext } from "@/context/ChatContext";


interface ChatProps {
  socket: any;
  username: string;
  roomId: string;
}

export interface Message {
  sender: string;
  text: string;
  timestamp: any;
}

const Chat: React.FC<ChatProps> = ({ socket, username, roomId }) => {
  const { messages, setMessages } = useContext(ChatContext);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!socket) return;

    socket.emit(ACTIONS.GET_MESSAGES, { roomId });
    // Receive new messages
    socket.on(ACTIONS.RECEIVE_MESSAGE, (data:{sender: string, text: string,private: boolean, timestamp: any}) => {
      console.log("data", data);
      setMessages((prev) => [...prev, { sender: data.sender, text:data.text, timestamp: data.timestamp }]);
    });

    socket.on(ACTIONS.LOAD_MESSAGES, (chatHistory: Message[]) => {
      console.log("Loaded messages in chat component:", chatHistory);
      setMessages(chatHistory); // Update chat history from server
    });

    return () => {
      socket.off(ACTIONS.RECEIVE_MESSAGE);
    };
  }, [socket, roomId]);


  const sendMessage = () => {
    if (message.trim() === "") return;
    console.log("username", username,"messages", messages);
    const newMessage: Message = { sender: username, text: message, timestamp: new Date().toISOString() };
    console.log("newMessage", newMessage);
    // Emit message event to the room
    socket.emit(ACTIONS.SEND_MESSAGE, { roomId,message: newMessage.text, username: newMessage.sender, timestamp: newMessage.timestamp });
    // Add message to chat (optimistic UI)
    // setMessages((prev) => [...prev, newMessage]);
    setMessage("");
  };

  return (
    <div className="flex md:flex-col justify-between md:h-screen p-2 md:p-4 items-center">
      <div className="w-full hidden md:flex gap-4 flex-wrap overflow-y-auto mb-5 px-2">
        <div className="text-black w-[90px] h-8 flex items-center justify-center rounded bg-green-400">
          Chat
        </div>
        <div className="w-full h-[0.5px] bg-[#aaaaaa]"></div>

        {/* Chat Messages */}
        <div className="flex flex-col w-full max-h-[300px] overflow-y-auto">
          {messages.map((msg, index) => (
            <div key={index} className="flex flex-row items-center gap-2 px-2">
              <Avatar name={msg.sender} size={"30"} />
              <p className="text-white mt-1">
                <strong>{msg.sender}: </strong> {msg.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Input */}
      <div className="flex flex-row md:w-3/4 md:mx-auto">
        <input
          type="text"
          value={message}
          onChange={(e) => {
            
            setMessage(e.target.value)}}
          className="w-full p-2 rounded-lg border border-gray-600 bg-gray-800 text-white"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="h-8 md:h-10 px-4 text-sm font-medium text-white bg-green-800 rounded-lg hover:bg-green-600"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
