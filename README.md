# CC WebSocket - 简洁的WebSocket工具

为cc-session和cc-json-parser提供简洁的WebSocket通信功能，支持双向数据传输。

## ✨ 特性

- 🔌 **简洁API**: 只提供start、stop、send三个核心接口
- 📨 **双向通信**: 支持发送和接收客户端消息
- 🛡️ **连接管理**: 自动处理连接、断开和错误
- 🎯 **类型安全**: 完整的TypeScript类型支持
- 📊 **状态监控**: 实时查看连接状态和客户端信息
- 🌐 **易于集成**: 可轻松嵌入到cc-joint-test等项目

## 📦 安装

```bash
bun add cc-communication
```

## 🚀 快速开始

### 基本使用

```typescript
import { CCWebSocket } from 'cc-communication';

// 创建WebSocket服务器
const ws = new CCWebSocket({
  port: 3001,
  host: 'localhost',
  path: '/ws'
});

// 启动服务器
await ws.start();

// 发送数据给所有客户端
ws.send({ message: 'Hello World!' }, 'greeting');

// 停止服务器
await ws.stop();
```

### 监听客户端消息

```typescript
import { CCWebSocket, type MessageHandlers } from 'cc-communication';

const handlers: MessageHandlers = {
  // 接收所有客户端消息
  onMessage: (message) => {
    console.log(`收到来自 ${message.clientId} 的消息:`, message.data);
  },

  // 客户端连接事件
  onClientConnect: (clientId) => {
    console.log(`客户端 ${clientId} 已连接`);
  },

  // 客户端断开事件
  onClientDisconnect: (clientId) => {
    console.log(`客户端 ${clientId} 已断开`);
  },

  // 自定义消息类型处理
  onCustomMessage: (type, data, clientId) => {
    if (type === 'chat') {
      // 回复聊天消息
      ws.sendToClient(clientId, { reply: `已收到: ${data.message}` }, 'chat_reply');
    }
  }
};

const ws = new CCWebSocket({ port: 3001 }, handlers);
await ws.start();
```

### 在cc-joint-test中使用

```typescript
import { CCWebSocket } from 'cc-communication';

// 创建WebSocket服务器
const ws = new CCWebSocket({
  port: 3001,
  handlers: {
    onCustomMessage: (type, data, clientId) => {
      if (type === 'request_session') {
        // 客户端请求创建新的session
        console.log(`客户端 ${clientId} 请求创建session`);
      }
    }
  }
});

await ws.start();

// 当获得cc-session数据时，发送给前端
function onSessionData(sessionData: any) {
  ws.send(sessionData, 'session');
}

// 当获得cc-json-parser数据时，发送给前端
function onParserData(parserData: any) {
  ws.send(parserData, 'parser');
}
```

## 📖 API文档

### CCWebSocket

#### 构造函数

```typescript
new CCWebSocket(config?: WebSocketConfig, handlers?: MessageHandlers)
```

#### 方法

- `start(): Promise<void>` - 启动WebSocket服务器
- `stop(): Promise<void>` - 停止WebSocket服务器
- `send(data: any, type?: string): void` - 发送数据给所有客户端
- `sendToClient(clientId: string, data: any, type?: string): void` - 发送数据给指定客户端
- `getStatus(): WebSocketStatus` - 获取服务器状态
- `getConnectedClients(): string[]` - 获取所有连接的客户端ID
- `isClientConnected(clientId: string): boolean` - 检查客户端是否连接
- `setHandlers(handlers: MessageHandlers): void` - 设置消息处理器

### 类型定义

#### WebSocketConfig

```typescript
interface WebSocketConfig {
  port?: number;     // 服务器端口 (默认: 3001)
  host?: string;     // 服务器地址 (默认: 'localhost')
  path?: string;     // WebSocket路径 (默认: '/ws')
}
```

#### MessageHandlers

```typescript
interface MessageHandlers {
  onMessage?: (message: ClientMessage) => void;
  onClientConnect?: (clientId: string) => void;
  onClientDisconnect?: (clientId: string) => void;
  onCustomMessage?: (type: string, data: any, clientId: string) => void;
}
```

## 🧪 测试

### 运行测试服务器

```bash
# 启动基本测试
bun run example

# 开发模式（带热重载）
bun run dev
```

### 使用测试客户端

1. 启动服务器:
   ```bash
   bun run example
   ```

2. 在浏览器中打开 `src/test/test-client.html`

3. 连接测试:
   - URL: `ws://localhost:3001/ws`
   - 点击"连接"按钮

4. 测试消息发送:
   ```javascript
   // 在浏览器控制台中
   ws.send(JSON.stringify({
     type: "chat",
     data: { message: "Hello Server!" }
   }));
   ```

## 🔧 开发

### 项目结构

```
src/
├── index.ts              # 主入口文件
├── websocket-bridge.ts   # CCWebSocket核心实现
└── test/                # 测试文件
    ├── test-client.html  # 前端测试客户端
    └── usage-example.ts  # 使用示例
```

### 构建项目

```bash
# 编译TypeScript
bun run build

# 运行测试
bun run test
```

## 🌍 前端连接示例

```javascript
// 连接WebSocket
const ws = new WebSocket('ws://localhost:3001/ws');

// 监听消息
ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('收到消息:', data);
};

// 发送消息
ws.send(JSON.stringify({
  type: 'chat',
  data: { message: 'Hello Server!' }
}));
```

## 📄 许可证

MIT License