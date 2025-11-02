/**
 * Simple WebSocket Tool
 * 提供简单的WebSocket功能，用于向客户端发送数据
 */

export interface WebSocketConfig {
  port?: number;
  host?: string;
  path?: string;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  clientId?: string;
}

export interface WebSocketStatus {
  isRunning: boolean;
  connectedClients: number;
  port: number;
  host: string;
}

export interface ClientMessage {
  type: string;
  data: any;
  timestamp: number;
  clientId: string;
}

export interface MessageHandlers {
  onMessage?: (message: ClientMessage) => void;
  onClientConnect?: (clientId: string) => void;
  onClientDisconnect?: (clientId: string) => void;
  onCustomMessage?: (type: string, data: any, clientId: string) => void;
}

export class CCWebSocket {
  private server: any = null;
  private clients: Map<string, any> = new Map(); // 改为Map，存储clientId到ws的映射
  private config: Required<WebSocketConfig>;
  private startTime: number = 0;
  private handlers: MessageHandlers = {};

  constructor(config: WebSocketConfig = {}, handlers: MessageHandlers = {}) {
    this.config = {
      port: config.port || 3001,
      host: config.host || 'localhost',
      path: config.path || '/ws',
    };
    this.handlers = handlers;
  }

  /**
   * 启动WebSocket服务器
   */
  async start(): Promise<void> {
    if (this.server) {
      throw new Error('WebSocket server is already running');
    }

    try {
      // 检查是否在Bun环境中
      if (typeof Bun !== 'undefined' && (Bun as any).serve) {
        this.server = (Bun as any).serve({
          hostname: this.config.host,
          port: this.config.port,
          fetch: (req: any, server: any) => {
            const url = new URL(req.url);

            if (url.pathname === this.config.path) {
              const success = server.upgrade(req);
              if (success) {
                return undefined;
              }
            }

            return new Response('WebSocket server', { status: 404 });
          },
          websocket: {
            message: (ws: any, message: string) => this.handleMessage(ws, message),
            open: (ws: any) => this.handleOpen(ws),
            close: (ws: any) => this.handleClose(ws),
            error: (ws: any, error: Error) => this.handleError(ws, error),
          },
        });

        this.startTime = Date.now();
        console.log(`✅ WebSocket server started on ws://${this.config.host}:${this.config.port}${this.config.path}`);
      } else {
        throw new Error('Bun.serve is not available. Please run this code in a Bun environment.');
      }
    } catch (error: any) {
      console.error('Failed to start WebSocket server:', error.message);
      throw error;
    }
  }

  /**
   * 设置消息处理器
   */
  setHandlers(handlers: MessageHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * 停止WebSocket服务器
   */
  async stop(): Promise<void> {
    if (!this.server) {
      return;
    }

    // 关闭所有连接
    for (const [clientId, ws] of this.clients) {
      ws.close(1000, 'Server shutting down');
    }
    this.clients.clear();

    // 停止服务器
    this.server.stop();
    this.server = null;

    console.log('✅ WebSocket server stopped');
  }

  /**
   * 发送数据给所有连接的客户端
   */
  send(data: any, type: string = 'message'): void {
    if (!this.server) {
      console.warn('WebSocket server is not running');
      return;
    }

    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now(),
    };

    const messageString = JSON.stringify(message);
    let sentCount = 0;

    for (const [clientId, ws] of this.clients) {
      if (ws.readyState === 1) { // WebSocket.OPEN
        try {
          ws.send(messageString);
          sentCount++;
        } catch (error: any) {
          console.warn(`Failed to send message to client ${clientId}:`, error.message);
          this.clients.delete(clientId);
        }
      }
    }

    if (sentCount > 0) {
      console.log(`📤 Sent ${type} to ${sentCount} client(s)`);
    }
  }

  /**
   * 发送数据给指定客户端
   */
  sendToClient(clientId: string, data: any, type: string = 'message'): void {
    if (!this.server) {
      console.warn('WebSocket server is not running');
      return;
    }

    const ws = this.clients.get(clientId);
    if (!ws) {
      console.warn(`Client ${clientId} not found`);
      return;
    }

    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now(),
      clientId,
    };

    try {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify(message));
        console.log(`📤 Sent ${type} to client ${clientId}`);
      }
    } catch (error: any) {
      console.warn(`Failed to send message to client ${clientId}:`, error.message);
      this.clients.delete(clientId);
    }
  }

  /**
   * 获取服务器状态
   */
  getStatus(): WebSocketStatus {
    return {
      isRunning: this.server !== null,
      connectedClients: this.clients.size,
      port: this.config.port,
      host: this.config.host,
    };
  }

  /**
   * 获取所有连接的客户端ID列表
   */
  getConnectedClients(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * 检查特定客户端是否连接
   */
  isClientConnected(clientId: string): boolean {
    const ws = this.clients.get(clientId);
    return ws && ws.readyState === 1;
  }

  /**
   * 处理客户端连接
   */
  private handleOpen(ws: any): void {
    const clientId = this.generateClientId();
    ws.data = { clientId, connectedAt: Date.now() };
    this.clients.set(clientId, ws);

    console.log(`🔗 Client connected: ${clientId} (total: ${this.clients.size})`);

    // 触发连接事件
    this.handlers.onClientConnect?.(clientId);

    // 发送连接确认
    try {
      ws.send(JSON.stringify({
        type: 'connected',
        data: {
          clientId,
          message: 'Connected to CC WebSocket server',
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      }));
    } catch (error: any) {
      console.warn(`Failed to send welcome message to ${clientId}:`, error.message);
    }
  }

  /**
   * 处理客户端断开
   */
  private handleClose(ws: any): void {
    const clientId = ws.data?.clientId;
    if (clientId) {
      this.clients.delete(clientId);
      console.log(`🔌 Client disconnected: ${clientId} (total: ${this.clients.size})`);

      // 触发断开事件
      this.handlers.onClientDisconnect?.(clientId);
    }
  }

  /**
   * 处理客户端消息
   */
  private handleMessage(ws: any, message: string): void {
    const clientId = ws.data?.clientId || 'unknown';

    try {
      const data = JSON.parse(message);
      const clientMessage: ClientMessage = {
        type: data.type,
        data: data.data,
        timestamp: Date.now(),
        clientId,
      };

      // 处理心跳
      if (data.type === 'ping') {
        ws.send(JSON.stringify({
          type: 'pong',
          data: { timestamp: Date.now() },
          timestamp: Date.now(),
        }));
        return;
      }

      // 触发消息处理器
      this.handlers.onMessage?.(clientMessage);
      this.handlers.onCustomMessage?.(data.type, data.data, clientId);

    } catch (error: any) {
      console.warn(`Failed to parse message from client ${clientId}:`, error.message);

      // 发送错误响应
      try {
        ws.send(JSON.stringify({
          type: 'error',
          data: {
            message: 'Invalid message format',
            timestamp: Date.now(),
          },
          timestamp: Date.now(),
        }));
      } catch (sendError: any) {
        console.warn(`Failed to send error response to ${clientId}:`, sendError.message);
      }
    }
  }

  /**
   * 处理错误
   */
  private handleError(ws: any, error: any): void {
    const clientId = ws.data?.clientId || 'unknown';
    console.error(`WebSocket error for client ${clientId}:`, error.message || error);

    if (clientId) {
      this.clients.delete(clientId);
      this.handlers.onClientDisconnect?.(clientId);
    }
  }

  /**
   * 生成客户端ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}