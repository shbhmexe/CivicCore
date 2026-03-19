import { createServer } from "http";
import { Server } from "socket.io";
import next from "next";
import cron from "node-cron";
import { runEscalationCycle } from "./lib/escalation";

// Schedule the AI Escalation Bot to run every 1 minute (for testing)
cron.schedule("* * * * *", async () => {
    console.log("[CRON] 🤖 Starting scheduled Escalation Bot check...");
    await runEscalationCycle();
    console.log("[CRON] ✅ Escalation Bot finished execution.");
});

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
            console.log(`[Socket.IO] ${socket.id} JOINED complaint-${complaintId}`);
            // Verify rooms
            console.log(`[Socket.IO] Current rooms for ${socket.id}:`, Array.from(socket.rooms));
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

        socket.on("status-update", (data: { complaintId: string; status: string; resolvedAt?: any }) => {
            // Broadcast to everyone in the complaint room
            io.to(`complaint-${data.complaintId}`).emit("status-update", data);
            console.log(`[Socket.IO] Status update broadcast for complaint-${data.complaintId}: ${data.status}`);
        });

        socket.on("vote-change", (data: { complaintId: string; voteCount: number }) => {
            // Broadcast globally so even dashboard cards (not in a specific room) can update
            io.emit("vote-updated", data);
            console.log(`[Socket.IO] Vote update broadcast for complaint-${data.complaintId}: ${data.voteCount} votes`);
        });

        // Broadcast new civic activities (reports, resolutions, etc.) to the live feed
        socket.on("new-activity", () => {
             // Simply broadcast a refetch signal to everyone listening to the feed
             io.emit("activity-broadcast");
             console.log(`[Socket.IO] New activity broadcasted to all clients`);
        });

        // Broadcast newly created issues to all clients for nearby crowd verification
        socket.on("trigger-nearby-verification", (data: { complaintId: string; title: string; latitude: number; longitude: number }) => {
            // Forward the issue coordinates to all connected clients
            // The clients will calculate their own distance to decide whether to show the popup
            socket.broadcast.emit("broadcast-nearby-verification", data);
            console.log(`[Socket.IO] Broadcasted verification request for issue: ${data.complaintId} at [${data.latitude}, ${data.longitude}]`);
        });

        socket.on("join-user", (userId: string) => {
            socket.join(`user-${userId}`);
            console.log(`[Socket.IO] ${socket.id} JOINED user-${userId}`);
            console.log(`[Socket.IO] Current rooms for ${socket.id}:`, Array.from(socket.rooms));
        });

        socket.on("send-notification", (data: { targetUserId: string; notification: any }) => {
            console.log(`[Socket.IO] Attempting to send notification to user-${data.targetUserId}`);
            io.to(`user-${data.targetUserId}`).emit("notification-received", data.notification);
            console.log(`[Socket.IO] Notification emitted to user-${data.targetUserId}`);
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
