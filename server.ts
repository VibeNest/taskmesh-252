import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  TypedSocket,
  PresenceUser,
} from '@/types/socket';
import prisma from '@/lib/prisma';
import redis from '@/lib/redis';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const PRESENCE_TTL = 60;
const presence = new Map<string, PresenceUser>();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', async (socket: TypedSocket) => {
    const userId = socket.handshake.auth.userId;

    if (!userId) {
      socket.disconnect();
      return;
    }

    socket.data.userId = userId;

    socket.on('workspace:join', async (data) => {
      const { workspaceId } = data;
      socket.data.workspaceId = workspaceId;
      socket.join(`workspace:${workspaceId}`);
      const presenceUsers = Array.from(presence.values()).filter(
        (p) => p.workspaceId === workspaceId
      );
      socket.emit('workspace:joined', { workspaceId, members: presenceUsers });
      socket.to(`workspace:${workspaceId}`).emit('workspace:member_joined', {
        id: socket.data.userId,
        name: (await prisma.user.findUnique({ where: { id: socket.data.userId } }))?.name || null,
        image: (await prisma.user.findUnique({ where: { id: socket.data.userId } }))?.image || null,
        socketId: socket.id,
      });
    });

    socket.on('workspace:leave', async (data) => {
      const { workspaceId } = data;
      socket.leave(`workspace:${workspaceId}`);
      socket
        .to(`workspace:${workspaceId}`)
        .emit('workspace:member_left', { userId: socket.data.userId });
    });

    socket.on('board:join', async (data) => {
      const { boardId } = data;
      socket.data.boardId = boardId;
      socket.join(`board:${boardId}`);
      await updatePresence(socket, socket.data.userId, boardId);
      const presenceUsers = Array.from(presence.values()).filter((p) => p.boardId === boardId);
      socket.emit('board:joined', { boardId, presence: presenceUsers });
      socket.to(`board:${boardId}`).emit('presence:update', {
        id: socket.data.userId,
        name: (await prisma.user.findUnique({ where: { id: socket.data.userId } }))?.name || null,
        image: (await prisma.user.findUnique({ where: { id: socket.data.userId } }))?.image || null,
        socketId: socket.id,
        isTyping: false,
      });
    });

    socket.on('board:leave', async (data) => {
      const { boardId } = data;
      socket.leave(`board:${boardId}`);
      await removePresence(socket.data.userId, boardId);
      socket.to(`board:${boardId}`).emit('presence:update', {
        id: socket.data.userId,
        socketId: socket.id,
        isTyping: false,
        left: true,
      });
    });

    socket.on('presence:update', async (data) => {
      const { boardId, isTyping } = data;
      await updatePresence(socket, socket.data.userId, boardId, isTyping);
      socket.to(`board:${boardId}`).emit('presence:update', {
        id: socket.data.userId,
        name: (await prisma.user.findUnique({ where: { id: socket.data.userId } }))?.name || null,
        image: (await prisma.user.findUnique({ where: { id: socket.data.userId } }))?.image || null,
        socketId: socket.id,
        isTyping,
      });
    });

    socket.on('task:create', (data) => {
      socket.to(`board:${socket.data.boardId}`).emit('task:created', {
        ...data,
        userId: socket.data.userId,
      });
    });

    socket.on('task:update', (data) => {
      socket.to(`board:${socket.data.boardId}`).emit('task:updated', {
        ...data,
        userId: socket.data.userId,
      });
    });

    socket.on('task:move', (data) => {
      socket.to(`board:${data.boardId}`).emit('task:moved', data);
    });

    socket.on('task:delete', (data) => {
      socket.to(`board:${data.boardId}`).emit('task:deleted', data);
    });

    socket.on('column:create', (data) => {
      socket.to(`board:${socket.data.boardId}`).emit('column:created', {
        ...data,
        userId: socket.data.userId,
      });
    });

    socket.on('column:update', (data) => {
      socket.to(`board:${socket.data.boardId}`).emit('column:updated', {
        ...data,
        userId: socket.data.userId,
      });
    });

    socket.on('column:delete', (data) => {
      socket.to(`board:${data.boardId}`).emit('column:deleted', data);
    });

    socket.on('comment:create', (data) => {
      socket.to(`board:${data.boardId}`).emit('comment:created', {
        ...data,
        userId: socket.data.userId,
      });
    });

    socket.on('comment:update', (data) => {
      socket.to(`board:${data.boardId}`).emit('comment:updated', {
        ...data,
        userId: socket.data.userId,
      });
    });

    socket.on('comment:delete', (data) => {
      socket.to(`board:${data.boardId}`).emit('comment:deleted', data);
    });

    socket.on('typing:start', async (data) => {
      const boardId = socket.data.boardId;
      await updatePresence(socket, socket.data.userId, boardId, true);
      socket.to(`board:${boardId}`).emit('typing:start', {
        userId: socket.data.userId,
        taskId: data.taskId,
        name: (await prisma.user.findUnique({ where: { id: socket.data.userId } }))?.name || null,
        image: (await prisma.user.findUnique({ where: { id: socket.data.userId } }))?.image || null,
        socketId: socket.id,
      });
    });

    socket.on('typing:stop', async (data) => {
      const boardId = socket.data.boardId;
      await updatePresence(socket, socket.data.userId, boardId, false);
      socket.to(`board:${boardId}`).emit('typing:stop', {
        userId: socket.data.userId,
        taskId: data.taskId,
        socketId: socket.id,
      });
    });

    socket.on('disconnect', async () => {
      await cleanupPresence(socket);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});

async function updatePresence(
  socket: TypedSocket,
  userId: string,
  boardId: string,
  isTyping = false
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const presenceData: PresenceUser = {
    id: userId,
    name: user.name || null,
    image: user.image || null,
    socketId: socket.id,
    boardId,
    workspaceId: socket.data.workspaceId,
    isTyping,
  };

  presence.set(socket.id, presenceData);

  await redis.hset(`presence:${boardId}`, socket.id, JSON.stringify(presenceData));
  await redis.expire(`presence:${boardId}`, PRESENCE_TTL);
}

async function removePresence(userId: string, boardId: string) {
  const entries = Array.from(presence.entries());
  for (const [socketId, p] of entries) {
    if (p.id === userId && p.boardId === boardId) {
      presence.delete(socketId);
      await redis.hdel(`presence:${boardId}`, socketId);
    }
  }
}

async function cleanupPresence(socket: TypedSocket) {
  const presenceData = presence.get(socket.id);
  if (presenceData) {
    presence.delete(socket.id);
    await redis.hdel(`presence:${presenceData.boardId}`, socket.id);
    socket.to(`board:${presenceData.boardId}`).emit('presence:update', {
      id: socket.data.userId,
      socketId: socket.id,
      isTyping: false,
      left: true,
    });
  }
}
