import koa from 'koa'
import JWT from 'koa-jwt'
import path from 'path'
import helmet from 'koa-helmet'
import statics from 'koa-static'
import router from './routes/routes'
import koaBody from 'koa-body'
import jsonutil from 'koa-json'
import cors from '@koa/cors'
import compose from 'koa-compose'
import compress from 'koa-compress'
import config from './config/index'
import errorHandle from './common/ErrorHandle'
import WebSocketServer from './config/WebSocket'
import Auth from './common/auth'
import init from './common/init'
import log4js from './config/Log4'
import https from 'https'
import fs from 'fs'
const isDevMode = process.env.NODE_ENV === 'production' ? false : true
const app = new koa()

const httpsOption = {
  key: fs.readFileSync(path.join(__dirname, './cert/7396045_www.toped.top.key'), 'utf8'),
  cert: fs.readFileSync(path.join(__dirname, './cert/7396045_www.toped.top.pem'), 'utf8')
}

const server = https.createServer(httpsOption, app.callback())
server.listen(444)

const server2 = ''
if (!isDevMode) {
  const httpsOption2 = {
    key: fs.readFileSync(path.join(__dirname, './cert/7403365_www.toped.top.key'), 'utf8'),
    cert: fs.readFileSync(path.join(__dirname, './cert/7403365_www.toped.top.pem'), 'utf8')
  }
  const server2 = https.createServer(
    httpsOption2, 
    app.callback()
  ).listen(3001)
}

const ws = new WebSocketServer()
ws.init(server2)
global.ws = ws

const jwt = JWT({ secret: config.JWT_SERCET }).unless({ path: [/^\/public/, /\/login/]})
/**
 * 使用koa-compose 集成中间件
 */
const middleware = compose([
  koaBody({
    multipart: true,
    formidable: {
      keepExtensions: true,
      maxFieldsSize: 5*1024*1024
    },
    onError: err => {
      console.log(err)
    }
  }),
  statics(path.join(__dirname, '../public')),
  cors(),
  jsonutil({ pretty: false, param: 'pretty' }),
  helmet(),
  jwt,
  Auth,
  errorHandle,
  isDevMode ? log4js.koaLogger(log4js.getLogger('http'),{
    level: 'auto'
  }) : log4js.koaLogger(log4js.getLogger('access'),{
    level: 'auto'
  })
])

if (!isDevMode) {
  app.use(compress())
}

app.use(middleware)
app.use(router())

app.listen(3000, () => {
  console.log('app is runing at 3000')
  init()
})

export default server