import { io } from "socket.io-client";

const ENDPOINT = "http://localhost:8000"; // আপনার সার্ভার URL
export const socket = io(ENDPOINT, { autoConnect: false });