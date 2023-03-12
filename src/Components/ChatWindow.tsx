import { useEffect, useState, useRef } from "react";
import { useChatCallbacks } from "../Callbacks/useChatCallbacks";
import { ChatEventType, MessageType, useChatSingleton } from "../Singleton/ChatSingleton"
import './styles/chatWindowStyles.scss';

export const ChatWindow = () => {
	const [messages, setMessages] = useState<MessageType[]>([]);


	useChatCallbacks({
		messageListCallback: (messages) => setMessages([...messages]),
	});
	return <div className="chatbox">
		{
			messages?.map(message => <div>
				{`${message.id}: ${message.content} ${message.confidence ?? ''}`}
			</div>)
		}
	</div>
}