import axios, { CancelToken } from "axios"
import { url } from "inspector"
import { MessageType } from "../../Singleton/ChatSingleton";
  
const baseUrl = 'front23.omegle.com'
const rand = '3ABQC5LE';

export const communicationsApi = {
    connect: () => {
        return axios.post("https://waw3.omegle.com/check");
    },
    startChat: ({randid, accessKey}:{randid: string, accessKey: string}) => {
        if(!randid || !accessKey) return;
        return axios.post(`http://localhost:3001/start`, {randid:rand, cc: accessKey, origin:"https://www.omegle.com", host:`${baseUrl}`});
    },
    checkEvent: (shardId: string, cancelToken?: CancelToken) => {
        return axios.post(`http://localhost:3001/events`, {id: shardId, origin:"https://www.omegle.com", host:`${baseUrl}`}, {timeout: 999999, cancelToken});
    },
    sendTypingEvent: (shardId: string) => {
        return axios.post(`http://localhost:3001/typing`, {id: shardId, origin:"https://www.omegle.com", host:`${baseUrl}`});
    },
    sendStoppedTypingEvent: (shardId: string) => {
        return axios.post(`http://localhost:3001/stoppedtyping`, {id: shardId, origin:"https://www.omegle.com", host:`${baseUrl}`});
    },
    sendMessage: (message: MessageType, shardId: string) => {
        return axios.post(`http://localhost:3001/send`, {msg: message.content, id: shardId, origin:"https://www.omegle.com", host:`${baseUrl}`});
    },
    disconnect: (shardId: string) => {
        return axios.post(`http://localhost:3001/disconnect`, {id: shardId, origin:"https://www.omegle.com", host:`${baseUrl}`});
    }
}