import { EventType } from "@testing-library/react";
import { ChatEventType } from "../Singleton/ChatSingleton";
import { EventNames } from "../Singleton/helpers";

export function makeid(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

