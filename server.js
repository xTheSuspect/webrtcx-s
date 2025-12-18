import { WebSocketServer } from "ws";

const wss = new WebSocketServer({
  port: process.env.PORT || 8080
});

const rooms = new Map();

wss.on("connection", ws => {
  let room = null;

  ws.on("message", msg => {
    const data = JSON.parse(msg);

    if (data.type === "join") {
      room = data.room;
      if (!rooms.has(room)) rooms.set(room, []);
      rooms.get(room).push(ws);
      return;
    }

    if (room && rooms.has(room)) {
      for (const client of rooms.get(room)) {
        if (client !== ws && client.readyState === 1) {
          client.send(JSON.stringify(data));
        }
      }
    }
  });

  ws.on("close", () => {
    if (room && rooms.has(room)) {
      rooms.set(room, rooms.get(room).filter(c => c !== ws));
      if (rooms.get(room).length === 0) {
        rooms.delete(room);
      }
    }
  });
});