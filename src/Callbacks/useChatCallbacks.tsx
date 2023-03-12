import { useEffect } from "react";
import { ChatEventType, MessageType } from "../Singleton/ChatSingleton";
import { EventNames } from "../Singleton/helpers";

export const useChatCallbacks = (callbacks?: {
  messageListCallback?: (messages: MessageType[]) => void;
  connectionCallback?: (status: boolean) => void;
  initializedCallback?: () => void;
  confidenceCallback?: (confidence: number) => void
  typingCallback?: () => void
}) => {
  useEffect(() => {
    document.addEventListener("chatEvent", (ev: CustomEventInit) => {
      const { key, value }: ChatEventType = ev.detail;
      switch (key) {
        case EventNames.CONNECTED:
          console.log("connected callback --> ", value);
          callbacks?.connectionCallback?.(value);
          break;
        case EventNames.GOT_MESSAGE:
          console.log("got message callback --> ", value);
          callbacks?.messageListCallback?.(value);
          break;
        case EventNames.INITIALIZED:
          console.log("initialized callback");
          callbacks?.initializedCallback?.();
          break;
        case EventNames.CONFIDENCE:
          console.log("confidence callback --> ", value);
          callbacks?.confidenceCallback?.(value);
          break;
          case EventNames.TYPING:
            console.log("typing callback");
            callbacks?.typingCallback?.();
            break;
        default:
          console.log("unknown callback: ", ev.detail);
          break;
      }
    });
  }, []);
};
