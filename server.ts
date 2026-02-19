import { createServer } from "http";
import { Server } from "socket.io";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const hostname = dev ? "localhost" : "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
    // --- Single HTTP Server for both Next.js and Socket.IO ---
    const httpServer = createServer(handler);

    const io = new Server(httpServer, {
        path: "/api/socketio",
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
        addTrailingSlash: false,
    });

    io.on("connection", (socket) => {
        console.log("[Socket.IO] Client connected:", socket.id);

        // Join a complaint room for targeted messaging
        socket.on("join-complaint", (complaintId: string) => {
            socket.join(`complaint-${complaintId}`);
            console.log(`[Socket.IO] ${socket.id} joined complaint-${complaintId}`);
        });

        // Leave a complaint room
        socket.on("leave-complaint", (complaintId: string) => {
            socket.leave(`complaint-${complaintId}`);
            console.log(`[Socket.IO] ${socket.id} left complaint-${complaintId}`);
        });

        // When a new comment is sent — broadcast to the complaint room (except sender)
        socket.on("new-comment", (data: { complaintId: string; comment: any }) => {
            socket.to(`complaint-${data.complaintId}`).emit("comment-received", data.comment);
            console.log(`[Socket.IO] Comment broadcast to complaint-${data.complaintId}`);
        });

        // When complaint status changes
        socket.on("status-update", (data: { complaintId: string; status: string }) => {
            io.emit("complaint-status-changed", data);
            console.log(`[Socket.IO] Status update broadcast for complaint-${data.complaintId}`);
        });

        // When a vote is cast — broadcast updated count to all clients viewing that complaint
        socket.on("vote-change", (data: { complaintId: string; voteCount: number }) => {
            socket.to(`complaint-${data.complaintId}`).emit("vote-updated", data);
            console.log(`[Socket.IO] Vote update broadcast for complaint-${data.complaintId}: ${data.voteCount} votes`);
        });

        socket.on("disconnect", () => {
            console.log("[Socket.IO] Client disconnected:", socket.id);
        });
    });

    httpServer.listen(port, hostname, () => {
        console.log(`> Server ready on http://${hostname}:${port}`);
        console.log(`> Socket.IO attached at /api/socketio`);
    });
});
