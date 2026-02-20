import { createServer } from "http";
import { Server } from "socket.io";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

// In production (Render), bind to 0.0.0.0 so the service is reachable
// But always tell Next.js to use "localhost" for internal URL construction
const bindAddress = dev ? "localhost" : "0.0.0.0";

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

        socket.on("join-complaint", (complaintId: string) => {
            socket.join(`complaint-${complaintId}`);
            console.log(`[Socket.IO] ${socket.id} joined complaint-${complaintId}`);
        });

        socket.on("leave-complaint", (complaintId: string) => {
            socket.leave(`complaint-${complaintId}`);
            console.log(`[Socket.IO] ${socket.id} left complaint-${complaintId}`);
        });

        socket.on("new-comment", (data: { complaintId: string; comment: any }) => {
            socket.to(`complaint-${data.complaintId}`).emit("comment-received", data.comment);
            console.log(`[Socket.IO] Comment broadcast to complaint-${data.complaintId}`);
        });

        socket.on("clear-chat", (data: { complaintId: string }) => {
            socket.to(`complaint-${data.complaintId}`).emit("chat-cleared");
            console.log(`[Socket.IO] Chat cleared for complaint-${data.complaintId}`);
        });

        socket.on("status-update", (data: { complaintId: string; status: string }) => {
            io.emit("complaint-status-changed", data);
            console.log(`[Socket.IO] Status update broadcast for complaint-${data.complaintId}`);
        });

        socket.on("vote-change", (data: { complaintId: string; voteCount: number }) => {
            socket.to(`complaint-${data.complaintId}`).emit("vote-updated", data);
            console.log(`[Socket.IO] Vote update broadcast for complaint-${data.complaintId}: ${data.voteCount} votes`);
        });

        socket.on("disconnect", () => {
            console.log("[Socket.IO] Client disconnected:", socket.id);
        });
    });

    httpServer.listen(port, bindAddress, () => {
        console.log(`> Server ready on http://${bindAddress}:${port}`);
        console.log(`> Socket.IO attached at /api/socketio`);
    });
});
