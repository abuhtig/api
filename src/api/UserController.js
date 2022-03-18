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
import bcrypt from 'bcryptjs'
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
    if (body.regmark.length > 20 ) {
      ctx.body = {
        code: 500,
        msg: '更新失败,标签名过长!'
      }
      return
    }
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
    if ( result.n === 1 && result.ok === 1) {
      ctx.body = {
        code: 200,
        msg: msg === '' ? '更新成功' : msg
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '更新失败'
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
    ctx.body = {
      code: 200,
      data: result
    }
  }

  async getinfo (ctx) {
    const obj = await getJWTPayload(ctx.header.authorization)
    const result = await User.findOne({ _id: obj._id})
    const userObj = result.toJSON()
    //屏蔽掉不需要传给前端的数据,然后删除
    const arr = ['password', 'username']
    arr.map((item) => {
      delete userObj[item]
    })
    ctx.body = {
      code: 200,
      data: userObj
    }
  }

  async getUserList (ctx) {
    const {body} = ctx.request
    const page = body.page ? parseInt(body.page) : 0
    const limit = body.limit ? parseInt(body.limit) : 10
    const option = body.option || {}
    const users = await User.getList(page, limit, option)
    const total = await User.getListCount(option)
    ctx.body = {
      code: 200,
      data: users,
      total: total
    }
  }
  // deleteUser&editUser管理员操作
  async editUser (ctx) {
    const { body } = ctx.request
    const user = await User.findOne({ _id: body._id })
    if (user) {
      if (body.password) {
        body.password = await bcrypt.hash(body.password, 5)
      } else {
        delete body.password
      }
      const result = await User.updateOne({ _id: body._id }, body)
      if ( result.n === 1 && result.ok === 1 ) {
        ctx.body = {
          code: 200,
          msg: '更新成功'
        }
      } else {
        ctx.body = {
          code: 500,
          msg: '更新失败'
        }
      }
    }
  }

  async batchUpdateUser (ctx) {
    const { body } = ctx.request
    const result = await User.updateMany({_id: { $in: body.ids }}, { $set: {...body.set} })
    if (result.ok === 1) {
      ctx.body = {
        code: 200,
        data: result
      }
    }
  }

  async deleteUser (ctx) {
    const { body } = ctx.request
    const result = await User.deleteMany({ _id: { $in: body } })
    if (result.ok === 1) {
      ctx.body = {
        code: 200,
        msg: '删除成功!'
      }   
    } else {
      ctx.body = {
        code: 500,
        msg: '删除失败!'
      }   
    }
  }

  async checkName (ctx) {
    const params = ctx.query
    const user = await User.findOne({ name: params.name })
    if (user) {
      ctx.body = {
        code: 500,
        msg: '昵称重复!'
      }  
    } else {
      ctx.body = {
        code: 200,
        msg: '昵称有效!'
      }
    }
  }

  async checkUsername (ctx) {
    const params = ctx.query
    const user = await User.findOne({ username: params.username })
    if (user) {
      ctx.body = {
        code: 500,
        msg: '邮箱重复!'
      }  
    } else {
      ctx.body = {
        code: 200,
        msg: '邮箱有效!'
      }
    }
  }

  async addUser (ctx) {
    const { body } = ctx.request
    body.password = await bcrypt.hash(body.password, 5)
    const user = new User(body)
    const result =await user.save()
    ctx.body = {
      code: 200,
      msg: '新增用户成功',
      data: result
    }
  }

  async getInfo (ctx) {
    const params = ctx.query
    const result = await User.findByID(params._id)
    if (result) {
      ctx.body = {
        code: 200,
        msg: '查询成功',
        data: result
      }
    } else {
      ctx.body = {
        code: 400,
        msg: '查询失败'
      }
    }
  }
}
export default new UserController()