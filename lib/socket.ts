"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
    if (!socket) {
        // Connect to the same origin (works for both localhost and production)
        socket = io({
            path: "/api/socketio",
            transports: ["websocket", "polling"],
        });
    }
    return socket;
}
