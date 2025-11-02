/**
 * CC WebSocket 使用示例
 * 展示如何在项目中使用CCWebSocket
 */

import { CCWebSocket, type MessageHandlers } from '../index';

async function usageExample() {
  // 1. 创建WebSocket服务器实例，并设置消息处理器
  const handlers: MessageHandlers = {
    // 接收所有客户端消息
    onMessage: (message) => {
      console.log(`📨 收到来自客户端 ${message.clientId} 的消息:`);
      console.log(`  类型: ${message.type}`);
      console.log(`  数据:`, message.data);
    },

    // 客户端连接事件
    onClientConnect: (clientId) => {
      console.log(`🔗 客户端 ${clientId} 已连接`);
      console.log(`📊 当前连接数: ${ws.getConnectedClients().length}`);
    },

    // 客户端断开事件
    onClientDisconnect: (clientId) => {
      console.log(`🔌 客户端 ${clientId} 已断开`);
      console.log(`📊 当前连接数: ${ws.getConnectedClients().length}`);
    },

    // 自定义消息类型处理
    onCustomMessage: (type, data, clientId) => {
      switch (type) {
        case 'chat':
          console.log(`💬 聊天消息 from ${clientId}:`, data.message);
          // 回复消息
          ws.sendToClient(clientId, {
            reply: `已收到消息: ${data.message}`,
            timestamp: Date.now()
          }, 'chat_reply');
          break;

        case 'command':
          console.log(`🎮 命令 from ${clientId}:`, data.command);
          break;

        case 'heartbeat':
          // 心跳消息已在内部处理
          break;
      }
    }
  };

  const ws = new CCWebSocket({
    port: 3001,
    host: 'localhost',
    path: '/ws'
  }, handlers);

  try {
    // 2. 启动服务器
    await ws.start();
    console.log('✅ CC WebSocket服务器已启动');
    console.log('🔗 前端连接地址: ws://localhost:3001/ws');

    // 3. 发送测试数据
    // 模拟cc-session数据
    const sessionData = {
      sessionId: 'session_123',
      type: 'message_added',
      data: {
        role: 'assistant',
        content: '这是来自cc-session的消息',
        timestamp: Date.now()
      }
    };
    ws.send(sessionData, 'session');

    // 模拟cc-json-parser数据
    const parserData = {
      success: true,
      data: {
        target: '项目目的',
        main_structure: '主体结构',
        parsed_at: Date.now()
      }
    };
    ws.send(parserData, 'parser');

    // 4. 演示动态更新处理器
    setTimeout(() => {
      console.log('\n🔄 动态更新消息处理器...');
      ws.setHandlers({
        ...handlers,
        onCustomMessage: (type, data, clientId) => {
          if (type === 'chat') {
            console.log(`🆕 新的聊天处理器 from ${clientId}:`, data.message);
            // 广播给所有客户端
            ws.send({
              user: clientId,
              message: data.message,
              timestamp: Date.now()
            }, 'broadcast');
          }
        }
      });
    }, 10000);

    // 5. 查看服务器状态
    console.log('📊 服务器状态:', ws.getStatus());

    // 6. 保持运行
    console.log('\n🌐 服务器正在运行...');
    console.log('💡 提示:');
    console.log('   - 在浏览器中打开 src/test/test-client.html 来测试连接');
    console.log('   - 可以发送以下类型的消息:');
    console.log('     * {"type": "chat", "data": {"message": "Hello"}}');
    console.log('     * {"type": "command", "data": {"command": "status"}}');
    console.log('   - 10秒后会更新消息处理器');
    console.log('⏹️  按 Ctrl+C 停止服务器');

    // 保持运行
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ 发生错误:', error);
    await ws.stop();
  }
}

// 模拟cc-joint-test中的使用方式
async function ccJointTestExample() {
  // 创建WebSocket服务器，并处理客户端消息
  const ws = new CCWebSocket({
    port: 3002,
  }, {
    // 处理客户端请求
    onCustomMessage: (type: string, data: any, clientId: string) => {
      if (type === 'request_session') {
        // 客户端请求创建新的session
        console.log(`📝 客户端 ${clientId} 请求创建session`);
        // 这里可以调用cc-session创建新的会话
      }

      if (type === 'send_message') {
        // 客户端发送消息给session
        console.log(`💬 客户端 ${clientId} 发送消息:`, data.message);
        // 这里可以调用cc-session发送消息
      }
    },

    // 监听客户端连接
    onClientConnect: (clientId: string) => {
      console.log(`🔗 cc-joint-test客户端 ${clientId} 已连接`);
      // 发送当前状态
      ws.sendToClient(clientId, {
        status: 'ready',
        sessionId: 'current_session_id',
      }, 'connection_status');
    }
  });

  await ws.start();

  // 在cc-joint-test中，当获得cc-session数据时：
  function onSessionData(sessionData: any) {
    ws.send(sessionData, 'session');
  }

  // 当获得cc-json-parser数据时：
  function onParserData(parserData: any) {
    ws.send(parserData, 'parser');
  }

  // 模拟数据接收
  onSessionData({
    type: 'message_added',
    data: { role: 'assistant', content: 'Hello from cc-session' }
  });

  onParserData({
    success: true,
    data: { result: 'parsed successfully' }
  });

  console.log('📡 cc-joint-test数据已通过WebSocket发送');
  console.log('🌐 服务器运行在 ws://localhost:3002/ws');
}

// 如果直接运行此文件
if (import.meta.main) {
  const args = process.argv.slice(2);
  if (args[0] === 'cc-joint') {
    ccJointTestExample();
  } else {
    usageExample();
  }
}

export { usageExample, ccJointTestExample };