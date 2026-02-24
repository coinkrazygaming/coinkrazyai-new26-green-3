import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { BingoService } from "./services/bingo-service";

let io: SocketIOServer | null = null;

export function setupSocketIO(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // ===== BINGO EVENTS =====
    socket.on("bingo:join_room", (data: { gameId: number; playerId: number; username: string; card: number[][] }) => {
      const room = `bingo_${data.gameId}`;
      socket.join(room);

      // Add player to game in service
      BingoService.addPlayerToGame(data.gameId, data.playerId, data.username, data.card);

      console.log(`Player ${data.playerId} joined bingo game ${data.gameId}`);
    });

    socket.on("bingo:start_game", (data: { gameId: number }) => {
      const started = BingoService.startCalling(data.gameId);
      if (started) {
        console.log(`Bingo game ${data.gameId} started`);
      }
    });

    socket.on("bingo:leave_room", (data: { gameId: number; playerId: number }) => {
      const room = `bingo_${data.gameId}`;
      socket.leave(room);
      BingoService.removePlayerFromGame(data.gameId, data.playerId);
      console.log(`Player ${data.playerId} left bingo game ${data.gameId}`);
    });

    // ===== POKER EVENTS =====
    socket.on("poker:join_table", (data: { tableId: number; playerId: number }) => {
      const room = `poker_${data.tableId}`;
      socket.join(room);
      console.log(`Player ${data.playerId} joined poker table ${data.tableId}`);
    });

    socket.on("poker:leave_table", (data: { tableId: number; playerId: number }) => {
      const room = `poker_${data.tableId}`;
      socket.leave(room);
      console.log(`Player ${data.playerId} left poker table ${data.tableId}`);
    });

    // ===== AI EVENTS =====
    socket.on("ai:subscribe_agent_status", (data: { agentId: string }) => {
      const room = `ai_agent_${data.agentId}`;
      socket.join(room);
      console.log(`Client subscribed to AI agent ${data.agentId} updates`);
    });

    socket.on("ai:unsubscribe_agent_status", (data: { agentId: string }) => {
      const room = `ai_agent_${data.agentId}`;
      socket.leave(room);
      console.log(`Client unsubscribed from AI agent ${data.agentId} updates`);
    });

    socket.on("ai:subscribe_dashboard", () => {
      socket.join("ai_dashboard");
      console.log(`Client subscribed to AI dashboard updates`);
    });

    socket.on("ai:unsubscribe_dashboard", () => {
      socket.leave("ai_dashboard");
      console.log(`Client unsubscribed from AI dashboard updates`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }
  return io;
}

export function emitWalletUpdate(userId: string, data: any) {
  if (io) {
    io.emit(`wallet:${userId}`, data);
    // For demo/simplicity, also emit global for the single user case
    io.emit("wallet:update", data);
  }
}

export function emitGameUpdate(gameType: string, data: any) {
  if (io) {
    io.emit(`${gameType}:update`, data);
  }
}

export function emitAdminNotification(notification: any) {
  if (io) {
    io.emit('admin:notification', notification);
  }
}

export function emitAIAgentStatusUpdate(agentId: string, status: any) {
  if (io) {
    // Emit to agent-specific room
    io.to(`ai_agent_${agentId}`).emit('ai:agent_status_update', {
      agentId,
      ...status,
      timestamp: new Date().toISOString()
    });

    // Also emit to dashboard room for broader updates
    io.to('ai_dashboard').emit('ai:dashboard_update', {
      agentId,
      ...status,
      timestamp: new Date().toISOString()
    });
  }
}

export function emitAIChatMessage(sessionId: string, message: any) {
  if (io) {
    io.to(`ai_session_${sessionId}`).emit('ai:chat_message', {
      sessionId,
      ...message,
      timestamp: new Date().toISOString()
    });
  }
}

export function emitAIEvent(eventType: string, data: any) {
  if (io) {
    io.emit(`ai:${eventType}`, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }
}
