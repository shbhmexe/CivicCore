import { createServer } from "http";
import { Server } from "socket.io";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const hostname = dev ? "localhost" : "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);
const socketPort = 3001;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
    // --- Next.js HTTP Server ---
    const nextServer = createServer(handler);
    nextServer.listen(port, hostname, () => {
        console.log(`> Next.js ready on http://${hostname === '0.0.0.0' ? 'render-host' : hostname}:${port}`);
    });

    // --- Socket.IO on separate port to avoid Next.js route conflicts ---
    const ioServer = createServer();
    const io = new Server(ioServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
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

    ioServer.listen(socketPort, hostname, () => {
        console.log(`> Socket.IO server running on http://${hostname === '0.0.0.0' ? 'render-host' : hostname}:${socketPort}`);
    });
});
