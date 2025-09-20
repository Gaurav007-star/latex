// server.js
import { setupWSConnection } from '@y/websocket-server/utils';
import * as http from "http";
import { WebSocketServer } from "ws";

const port = process.env.PORT || 1234;

// Create HTTP + WS server
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("✅ Yjs WebSocket server is running\n");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (conn, req) => {
  const roomName = req.url.slice(1).split("?")[0]; // use path as room name
  setupWSConnection(conn, req, { docName: roomName });
});

server.listen(port, () => {
  console.log(`🚀 Yjs WebSocket server running at ws://localhost:${port}`);
});
