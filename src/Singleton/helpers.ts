import { ChatEventType } from "./ChatSingleton";

export enum EventNames{
    GOT_MESSAGE= "gotMessage",
    TYPING= "typing",
    CONNECTED = "connected",
    STRANGER_DISCONNECTED="strangerDisconnected",
    INITIALIZED="initialized",
    CONFIDENCE="confidence"
}

export enum MembersEnum{
    me = "me",
    you = "you",
}

var num = 0,den = 0;

export const confidenceAggregator = (messageConfidence: number):number => {
    let weight = 1;
    // if(messageConfidence < 0.7) weight = 0.5;
    const res =( num + messageConfidence) / (den + weight);
    num += messageConfidence;
    den += weight;
    return res;
}

export const eventParser = (response: String[][]) : ChatEventType[] => response.map(e => ({key: e?.[0] as EventNames, value: e?.[1]}));