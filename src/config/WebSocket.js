import WebSocket from 'ws'
import { getJWTPayload } from '../common/Utils'
import Comments from '../model/Comments'

class WebSocketServer {
  constructor (config = {}) {
    const defaultConfig = {
      port: 3001,
      timeInterval: 30 * 1000,
      isAuth: true
    }

    const finalConfig = { ...defaultConfig, ...config }
    this.wss = {}
    this.timeInterval = finalConfig.timeInterval
    this.isAuth = finalConfig.isAuth
    this.port = finalConfig.port
    this.options = config.options || {}
  }
  // 初始化websocket服务
  init () {
    this.wss = new WebSocket.Server({ port: this.port, ...this.options })

    this.heartbeat()

    // 连接信息
    this.wss.on('connection', (ws) => {
      ws.isAlive = true
      ws.on('message', (msg) => this.onMessage(ws, msg))
      ws.on('close', () => this.onClose(ws))
    })
  }

  onMessage (ws, msg) {
    const msgObj = JSON.parse(msg)
    const events = {
      auth: async () => {
        try {
          const obj = await getJWTPayload(msgObj.msg)
          if (obj) {
            ws.isAuth = true
            ws._id = obj._id
            const num = await Comments.getTotal(obj._id)
            ws.send(JSON.stringify({
              event: 'message',
              msg: num
            }))
          }          
        } catch (error) {
           ws.send(JSON.stringify({
            event: 'noauth',
            msg: 'please auth again'
          }))
        }
      },
      heartbeat: () => {
        if (msgObj.message === 'pong') {
          ws.isAlive = true
        }
      },
      message: () => {
        // 鉴权拦截
        if (!ws.isAuth && this.isAuth) {
          return
        }
        // 消息广播
        this.wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN && client._id === ws._id) {
            this.send(msg)
          }
        })
      }
    }
    events[msgObj.event]()
  }

  onClose (ws) {
  }

  // 点对点消息发送
  send (uid, msg) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client._id === uid) {
        client.send(msg)
      }
    })
  }
  // 广播消息/系统消息
  broadcast (msg) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg)
      }
    })
  }

  heartbeat () {
    clearInterval(this.interval)
    this.interval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (!ws.isAlive && ws.roomid) {
          return ws.terminate()
        }

        ws.isAlive = false
        ws.send(JSON.stringify({
          event: 'heartbeat',
          msg: 'ping'
        }))
      })
    }, this.timeInterval)
  }
}

export default WebSocketServer