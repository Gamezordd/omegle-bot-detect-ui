import { useEffect, useRef, useState } from "react";
import { MessageType, useChatSingleton } from "../Singleton/ChatSingleton";
import { communicationsApi } from "../network/communication/communicationApi";
import { ChatInput } from "./ChatInput";
import { ChatWindow } from "./ChatWindow";
import { makeid } from "./helpers";
import { useChatCallbacks } from "../Callbacks/useChatCallbacks";
import { MembersEnum } from "../Singleton/helpers";

export const ChatLayout = () => {
  const chatSingleton = useChatSingleton();
  const listUpdateTimer = useRef<NodeJS.Timeout>();
  const messageTimer = useRef<NodeJS.Timeout>();
  const [connected, setConnected] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [confidence, setConfidence] = useState(1);

  const connectionCallback = (status: boolean) => {
    setConnected(status);
  };
  const initializedCallback = () => setInitialized(true);
  const confidenceCallback = (confidence: number) => {
    setConfidence(confidence);
  };
  const getgreeting = () => {
    const greetings = ["hi", "hey", "sup", "hey hows it going", "m", "f"];
    const index = Math.floor(Math.random() * 10) % 6;
    return greetings[index];
  };

  useEffect(() => {
    chatSingleton.initialize();
  });

  const messageListCallback = (messages: MessageType[]) => {
    if(listUpdateTimer.current){
      triggerTimer(messages.length);
    }
  }

const typingCallback = () => triggerTimer(0);

  useChatCallbacks({
    messageListCallback,
    connectionCallback,
    initializedCallback,
    confidenceCallback,
    typingCallback,
  });

  const toggleAutoText = () => {
    if (messageTimer.current) {
      clearInterval(messageTimer.current);
      messageTimer.current = undefined;
    } else {
      messageTimer.current = setInterval(() => {
        chatSingleton.sendMessage({
          content: getgreeting(),
          id: MembersEnum.me,
        });
      }, 3000);
    }
  };

  const restartChat = () => {
    clearInterval(messageTimer.current);
    chatSingleton.disconnect();
    setTimeout(() => {
      chatSingleton.connect();
    }, 1250);
  };

  const toggleTimer = () => {
    if(listUpdateTimer.current){
      clearTimeout(listUpdateTimer.current);
      listUpdateTimer.current = undefined;
    } else {
      triggerTimer(0);
    };
  }

  const triggerTimer = (length: number) => {
    if (length > 10) {
      return;
    }
    const timeout = length * 500 > 10000 ? length * 500 : 10000;
    console.log("timer: ", timeout);
    listUpdateTimer.current = setTimeout(() => {
      restartChat();
    }, timeout);
  }


  if (!initialized) return <div>Loading</div>;

  return (
    <div>
      <ChatWindow />
      <ChatInput
        connected={connected}
        onChange={() => triggerTimer(0)}
        onDisconnect={() => {
          clearTimeout(listUpdateTimer.current);
          clearInterval(messageTimer.current);
        }}
        confidence={confidence}
        onAutoText={toggleAutoText}
      />
      <button onClick={toggleTimer}>
        auto-disconnect
      </button>
    </div>
  );
};
