import SignRecord from '../model/SignRecord'
import collect from '../model/Collect'
import { getJWTPayload } from '../common/Utils'
import User from '../model/User'
import moment from 'dayjs'
import send from '../config/MailConfig'
import uuid from 'uuid/v4'
import { getValue, setValue } from '../config/RedisConfig'
import jwt from 'jsonwebtoken'
import config from '../config/index'
import bcrypt from 'bcrypt'
import Comments from '../model/Comments'

class UserController {
  async userSign (ctx) {
    // 取用户的ID
    const obj = await getJWTPayload(ctx.header.authorization)
    // 查询用户上次签到记录
    const record = await SignRecord.findByUid(obj._id)
    // 查询用户签到表数据
    const user = await User.findByID(obj._id)
    // 判断签到逻辑
    let newRecord = {}
    let result = ''
    if (record !== null) {
      if ( moment(record.created).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')) {
        ctx.body = {
          code: 500,
          msg: '已签到',
          favs: user.favs,
          count: user.count
        } 
        return
      } else {
        let count = user.count
        let fav = 0
        if (moment(record.created).format('YYYY-MM-DD') === moment().subtract(1, 'days').format('YYYY-MM-DD')) {
          count += 1
          if (count <= 10) {
            fav = 5
          } else if (count > 10 && count <= 20) {
            fav = 10
          } else if (count > 20 && count <= 40) {
            fav = 15
          } else {
            fav = 20
          }
          await User.updateOne({
            _id: obj._id
          },
          {
            $inc: {count: 1, favs: fav }
          })
          result = {
            favs: user.favs + fav,
            count: user.count + 1
          }
        } else {
          await User.updateOne({
            _id: obj._id
          },
          {
            $set: { count: 1 },
            $inc: { favs: 5 }
          })
          result = {
            favs: user.favs + fav,
            count: 1
          }
          fav = 5
        }
        newRecord = new SignRecord({
          uid: obj._id,
          favs: fav
        })
        await newRecord.save()
      }
    } else {
      // 无签到数据处理
      await User.updateOne({
        _id: obj._id
      },
      {
        $set: { count: 1 },
        $inc: { favs: 5 }
      })
      // 保存用户签到记录
      newRecord = new SignRecord({
        uid: obj._id,
        favs: 5
      })
      await newRecord.save()
      result = {
        favs: user.favs + 5,
        count: 1
      }
    }
    ctx.body = {
      code: 200,
      msg: 'cg',
      ...result
    }
  }

  async updateUserInfo (ctx) {
    const { body } = ctx.request
    const obj = await getJWTPayload(ctx.header.authorization)
    const user = await User.findOne({ _id: obj._id})
    let msg = ''
    if ( body.username !== user.username && !body.pic) {
      const tmpUser = await User.findOne({ username: obj.username })
      if ( tmpUser && tmpUser.password ) {
        ctx.body = {
          code: 501,
          msg: '用户名已存在/邮箱已被注册'
        }
        return
      }
      const key = uuid()
      setValue(key, jwt.sign({ _id: obj._id }, config.JWT_SERCET, {
        expiresIn: '30m'
      }))
      const result = await send({
        type: 'email',   
        data: {
           key: key,
           username: body.username
        },
        code: '',
        expire: moment()
          .add(30, 'minutes')
          .format('YYYY-MM-DD HH:mm:ss'),
        email: user.username,
        user: user.name,
      })
      msg = '基本信息已修改成功,用户名修改请到发送的邮件修改'
    }
    const arr = ['username', 'password', 'mobile']
    arr.map((item) => {delete body[item]})
    const result = await User.updateOne({ _id:obj._id }, body)
    if ( result.n === 1 && result.ok === 1 ) {
      ctx.body = {
        code: 200,
        msg: msg === '' ? '更新成功' : msg
      }
    } else {
      ctx.body = {
        code: 500,
        msg: 更新失败
      }
    }
  }

  async updateUsername (ctx) {
    const body = ctx.query
    if (body.key) {
      const token = await getValue(body.key)
      const obj = getJWTPayload('Bearer ' + token)
      await User.updateOne({ _id: obj._id }, {
        username: body.username
      })
      ctx.body = {
        code: 200,
        msg: '更新用户名成功!'
      }
    }
  }
  async updateUserpass (ctx) {
    const body = ctx.query
    if (body.key) {
      const token = await getValue(body.key)
      const obj = getJWTPayload('Bearer ' + token)
      const pass = await bcrypt.hash(body.password, 5)
      // const userpass = await User.findOne({ _id: obj._id})
      // if (userpass.password === password) {
      //   ctx.body = {
      //     code: 500,
      //     msg: '新密码与旧密码一致!'
      //   }
      // }
      await User.updateOne({ _id: obj._id }, {
        password: pass
      })
      ctx.body = {
        code: 200,
        msg: '更新密码成功!'
      }
    }
  }

  async changepw (ctx) {
    const { body } = ctx.request
    const obj = await getJWTPayload(ctx.header.authorization)
    const user = await User.findOne({ _id: obj._id})
    if (await bcrypt.compare(body.oldpwd, user.password)) {
      const pass = await bcrypt.hash(body.password, 5)
      await User.updateOne(
        { _id: obj._id }, 
        { $set: {password: pass}}
      )
      ctx.body = {
        code: 200,
        msg: '更改密码成功!'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '您输入的原密码不正确!'
      }
    }
  }

  async collect (ctx) {

  }

  async setCollect (ctx) {
    const params = ctx.query
    const obj = await getJWTPayload(ctx.header.authorization)
    if (parseInt(params.isCollect)) {
      await collect.deleteOne({ uid: obj._id, tid: params.tid })
      ctx.body = {
        code: 200,
        msg: '取消收藏成功'
      }
    } else {
      const newCollect = new collect({
        uid: obj._id,
        tid: params.tid,
        title: params.title
      })
      const result = await newCollect.save()
      if (result.uid) {
        ctx.body = {
          code: 200,
          msg: '收藏成功'
        }
      } else {
        ctx.body = {
          code: 400,
          msg: '收藏失败'
        }
      }
    }
  }

  async getmsg (ctx) {
    const params = ctx.query
    const page = params.page ? params.page : 0
    const limit = 6
    const obj = await getJWTPayload(ctx.header.authorization)
    const result = await Comments.getMsgList(obj._id, page, limit)
  }
}
export default new UserController()