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

        socket.on("connect", () => {
            console.log("[Socket.IO] Client connected to server:", socket?.id);
        });

        socket.on("connect_error", (error) => {
            console.error("[Socket.IO] Connection error:", error.message);
        });

        socket.on("disconnect", (reason) => {
            console.log("[Socket.IO] Client disconnected:", reason);
        });
    }
    return socket;
}
