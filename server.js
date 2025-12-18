import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 8080;

const wss = new WebSocketServer({ port: PORT });
const rooms = new Map();

console.log("✅ Signaling server running on port", PORT);

wss.on("connection", ws => {
  let roomId = null;

  ws.on("message", message => {
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      return;
    }

    /* ===== JOIN ROOM ===== */
    if (data.type === "join") {
      roomId = data.room;

      if (!rooms.has(roomId)) {
        rooms.set(roomId, []);
      }

      const room = rooms.get(roomId);
      room.push(ws);

      console.log(`👤 Client joined room ${roomId} (${room.length})`);

      // Notify peers when both are present
      if (room.length === 2) {
        room.forEach(client => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({ type: "peer-joined" }));
          }
        });
      }
      return;
    }

    /* ===== RELAY SIGNALING DATA ===== */
    if (!roomId || !rooms.has(roomId)) return;

    const room = rooms.get(roomId);
    room.forEach(client => {
      if (client !== ws && client.readyState === 1) {
        client.send(JSON.stringify(data));
      }
    });
  });

  ws.on("close", () => {
    if (!roomId || !rooms.has(roomId)) return;

    const room = rooms.get(roomId).filter(c => c !== ws);

    if (room.length === 0) {
      rooms.delete(roomId);
      console.log(`🗑 Room ${roomId} deleted`);
    } else {
      rooms.set(roomId, room);
      console.log(`❌ Client left room ${roomId}`);
    }
  });
});
