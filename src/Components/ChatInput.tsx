import { useState, useRef, useEffect } from "react";
import { useChatSingleton } from "../Singleton/ChatSingleton"
import { MembersEnum } from "../Singleton/helpers";
import './styles/chatWindowStyles.scss';

export const ChatInput = ({
    onDisconnect,
    connected,
    confidence,
    onAutoText,
    onChange,
}: {
    onDisconnect?: () => void;
    onAutoText?: () => void;
    onChange?: (val: string) => void;
    connected: boolean;
    confidence: number;
}) => {
    const [inputValue, setInputValue] = useState<string>('');
    const chatSingleton = useChatSingleton();
    const typingTimer = useRef<NodeJS.Timeout>();
    
    useEffect(() => {
        if(connected){
            setInputValue('');
        }
    },[connected])

    const handleChange = (text: string) => {
        onChange?.(text);
        if (typingTimer.current) {
            clearTimeout(typingTimer.current);
        } else {
            chatSingleton?.sendTypingEvent();
        }
        typingTimer.current = setTimeout(() => {
            chatSingleton?.sendStoppedTypingEvent();
            typingTimer.current = undefined;
        }, 5000);
        setInputValue(text);
    }

    const sendMessage = async () => {
        chatSingleton?.sendMessage({ id: MembersEnum.me, content: inputValue });
        clearTimeout(typingTimer.current);
        setInputValue('');
        // ChatSingleton?.printClientID();
    }
    return <div>
        <input disabled={!connected} value={inputValue} onChange={e => handleChange(e.currentTarget.value)}>
        </input>
        {
            connected && <button onClick={() => sendMessage()}>
                Send
            </button>
        }

        {
            connected ?
                <button onClick={() => {
                    chatSingleton.disconnect();
                    onDisconnect?.();
                }}>
                    Disconnect
                </button>
                :
                <button onClick={() => chatSingleton.connect()}>
                    Connect
                </button>
        }
        <button onClick={() => onAutoText?.()}>
            auto-text
        </button>
        <div>
            {confidence}
        </div>
    </div>
}