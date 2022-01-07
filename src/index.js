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

const app = new koa()
const ws = new WebSocketServer()
ws.init()
global.ws = ws

const isDevMode = process.env.NODE_ENV === 'production' ? false : true

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
