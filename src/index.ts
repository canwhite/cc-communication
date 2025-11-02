/**
 * CC WebSocket Tool
 * 提供简单的WebSocket功能，用于向客户端发送数据和接收客户端消息
 */

export { CCWebSocket } from './websocket-bridge';

// 类型导出
export type {
  WebSocketConfig,
  WebSocketMessage,
  WebSocketStatus,
  ClientMessage,
  MessageHandlers,
} from './websocket-bridge';

// 默认导出
export { CCWebSocket as default } from './websocket-bridge';
