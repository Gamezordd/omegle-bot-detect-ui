import { confidenceAggregator, EventNames, eventParser, MembersEnum } from "./helpers";
import React, { useRef, useEffect, useState } from 'react';
import { communicationsApi } from "../network/communication/communicationApi";
import { makeid } from "../Components/helpers";
import { spamDetectionModelInstance, SpamDetectionModel } from "../Model/model";
import axios, { CancelToken, CancelTokenSource } from "axios";

export type MessageType = { content: string, id: MembersEnum, confidence?: number };
type MembersType = { me: string, you: string }
export type ChatEventType = { key: EventNames, value?: any }

interface ChatSingletonInterface {
    withSpamDetection?: boolean; 
    messagesCallback: (messages: MessageType[]) => void;
    connectionCallback: (status: boolean) => void;
    initalizedCallback?: () => void;
    confidenceUpdateCallback?: (confidence: number) => void;
    typingCallback?: () => void;
}

class ChatSingleton {
    messages: MessageType[];
    members: MembersType;
    connected: boolean;
    clientID?: string;
    randID?: string;
    isTyping: boolean;
    spamDetectionModelInstance?: SpamDetectionModel;
    requestCancelToken: CancelTokenSource;
    aggregateConfidence: number;

    #initialized?: boolean;
    instance?: ChatSingleton;
    messagesCallback: (messages: MessageType[]) => void;
    connectionCallback?: (status: boolean) => void;
    initalizedCallback?: () => void;
    confidenceUpdateCallback?: (confidence: number) => void;
    typingCallback?: () => void;
    constructor(args: ChatSingletonInterface) {
        this.messages = [];
        this.members = { me: MembersEnum.me, you: MembersEnum.you };
        this.connected = false;
        this.randID = makeid(8);
        this.isTyping = false;
        this.aggregateConfidence = 1;
        this.messagesCallback = args?.messagesCallback;
        this.connectionCallback = args?.connectionCallback;
        this.initalizedCallback = args?.initalizedCallback;
        this.confidenceUpdateCallback = args?.confidenceUpdateCallback;
        this.typingCallback = args?.typingCallback;
        this.requestCancelToken = axios.CancelToken.source();
        if (this.instance) {
            console.log("instance already exists");
            return this.instance;
        } else {
            console.log("created new chat singleton instance");
            this.initialize(args);
            this.instance = this;
        }
    }

    initialize = async (initializeArgs?: ChatSingletonInterface) => {
        if(this.#initialized) return;
        const newModelInstance = spamDetectionModelInstance();
        if (initializeArgs?.withSpamDetection) {
            await newModelInstance.initialize();
            this.spamDetectionModelInstance = newModelInstance;
        }
        this.#initialized = true;
        this.initalizedCallback?.();
    }

    updateConnectedStatus = (value: boolean) => {
        this.connected = value;
        this.connectionCallback && this.connectionCallback(value);
    }

    checkForSpam = async (message: string) => {
        if (!this.spamDetectionModelInstance) {
            console.log("Spam detection not enabled.");
            return;
        }
        return await this.spamDetectionModelInstance.predict(message);
    }

    addMessage = async (message: MessageType) => {
        let receivedMessage = message;
        console.log("all messages:", this.messages);
        if (this.spamDetectionModelInstance && message.id === MembersEnum.you) {
            const messageConfidence = await this.spamDetectionModelInstance.predict(message.content);
            receivedMessage.confidence = messageConfidence;
            const calcConfidence = confidenceAggregator(messageConfidence ?? 1);
            this.aggregateConfidence = calcConfidence
            console.log("new confidence: ", calcConfidence);
            
            this.confidenceUpdateCallback?.(calcConfidence);
        }
        this.messages.push(receivedMessage);
        this.messagesCallback(this.messages);
    }

    _clearMessages = () => {
        this.messagesCallback([]);
        this.confidenceUpdateCallback?.(1);
        this.messages = [];
        this.aggregateConfidence = 1;
    }

    handleChatEvent = (event: ChatEventType) => {
        console.log("chat event --> ", event);

        switch (event.key) {
            case EventNames.CONNECTED:
                this.updateConnectedStatus(true);
                this._clearMessages();
                this.listenForEvents();
                break;
            case EventNames.GOT_MESSAGE:
                this.addMessage({ content: event.value, id: MembersEnum.you });
                this.listenForEvents();
                break;
            case EventNames.TYPING:
                this.typingCallback?.();
                this.listenForEvents();
                break;
            case EventNames.STRANGER_DISCONNECTED:
                this.updateConnectedStatus(false);
                break;
            default:
                console.log("Unknown Event:", event);
                this.listenForEvents();
                break;
        }
    }

    listenForEvents = async () => {
        try {
            if (!this.clientID) {
                console.log("ClientId error listenForEvents: ", this.clientID);
                return;
            }
            const evRes = await communicationsApi.checkEvent(this.clientID);
            const eventObjects = eventParser(evRes?.data);
            eventObjects.forEach(ev => this.handleChatEvent(ev));
        } catch (error) {
            console.log("error: ", error);
        }

    }

    connect = async () => {
        try {
            if (!this.randID) {
                console.log("RandId error connect: ", this.randID);
                return;
            }
            const res = await communicationsApi.connect();

            const startRes = await communicationsApi.startChat({
                randid: this.randID,
                accessKey: res.data,
            });

            this.clientID = startRes?.data.clientID;
            this.handleChatEvent({ key: EventNames.CONNECTED });
            this.listenForEvents();
        } catch (error) {
            console.log("error: ", error);
        }
    }

    disconnect = async () => {
        try {
            if (!this.clientID) {
                console.log("ClientId error listenForEvents: ", this.clientID);
                return;
            }
            this.requestCancelToken.cancel();

            const evRes = await communicationsApi.disconnect(this.clientID);
            if (evRes.data === "ok") {
                this.updateConnectedStatus(false);
            }
        } catch (error) {
            console.error(error);
        }
    }

    sendTypingEvent = async () => {
        try {
            if (!this.clientID) {
                console.log("ClientId error typing: ", this.clientID);
                return;
            }
            console.log("typing...");

            if (!this.isTyping) {
                const res = await communicationsApi.sendTypingEvent(this.clientID);
                this.isTyping = true;
            }
        } catch (error) {
            console.log("error: ", error);
        }
    }

    sendStoppedTypingEvent = async () => {
        try {
            if (!this.clientID) {
                console.log("ClientId error typing: ", this.clientID);
                return;
            }
            console.log("not typing...");
            if (this.isTyping) {
                const res = await communicationsApi.sendStoppedTypingEvent(this.clientID);
                this.isTyping = false;
            }
        } catch (error) {
            console.log("error: ", error);
        }
    }

    sendMessage = async (message: MessageType) => {
        try {
            if (!this.clientID) {
                console.log("ClientId error sendMessage: ", this.clientID);
                return;
            }
            this.isTyping = false;
            const res = await communicationsApi.sendMessage(message, this.clientID);
            if (res.data === 'ok') {
                this.addMessage(message);
            }
        } catch (error) {
            console.log("error: ", error);
        }

    }
    printClientID = () => {
        console.log("cid: ", this.clientID);
    }
}

var modelSingleton: ChatSingleton;


export const useChatSingleton = (): ChatSingleton => {
    const messagesCallback = (messages: MessageType[]) => {
        const eventBody: ChatEventType = { key: EventNames.GOT_MESSAGE, value: messages }
        const ev = new CustomEvent("chatEvent", { detail: eventBody });
        document.dispatchEvent(ev);
    }
    const connectionCallback = (status: boolean) => {
        const eventBody: ChatEventType = { key: EventNames.CONNECTED, value: status }
        const ev = new CustomEvent("chatEvent", { detail: eventBody });
        document.dispatchEvent(ev);
    }
    const initalizedCallback = () => {
        const eventBody: ChatEventType = { key: EventNames.INITIALIZED }
        const ev = new CustomEvent("chatEvent", { detail: eventBody });
        document.dispatchEvent(ev);
    }
    const confidenceUpdateCallback = (confidence: number) => {
        const eventBody: ChatEventType = { key: EventNames.CONFIDENCE, value: confidence }
        const ev = new CustomEvent("chatEvent", { detail: eventBody });
        document.dispatchEvent(ev);
    }
    const typingCallback = () => {
        const eventBody: ChatEventType = { key: EventNames.TYPING }
        const ev = new CustomEvent("chatEvent", { detail: eventBody });
        document.dispatchEvent(ev);
    }

    if (!modelSingleton) {
        const newInstance = new ChatSingleton({ messagesCallback, connectionCallback, initalizedCallback,confidenceUpdateCallback, typingCallback, withSpamDetection: true });
        modelSingleton = newInstance;
        return newInstance
    }
    return modelSingleton;
}