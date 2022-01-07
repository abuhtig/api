import log4js from '../config/Log4'
import errorRecord from '../model/errorRecord'
import User from '../model/User'
const logger = log4js.getLogger('error')
export default async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    logger.error(`${ctx.url} ${ctx.method} ${ctx.status} ${err.stack}`)
    let user = ''
    if (ctx._id) {
      user = await User.findOne({ _id: ctx._id })
    }
    await errorRecord.create({
      message: err.message,
      code: ctx.response.status,
      method: ctx.method,
      path: ctx.path,
      param: ctx.method === 'GET' ? ctx.query : ctx.request.body,
      username: user.username,
      stack: err.stack
    })
    if (err.status === 401) {
      ctx.status = 401
      ctx.body = {
      code:401,
      msg: 'Protected resource, use Authorization header to get'
      }
    } else {
      ctx.status = err.status || 500
      ctx.body = {
        code:500,
        msg:err.message
      }
    }
  }
}