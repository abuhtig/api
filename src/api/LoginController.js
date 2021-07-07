import send from '../config/MailConfig'
import moment from 'dayjs'
import bcrypt from 'bcrypt'
import jsonwebtoken from 'jsonwebtoken'
import config from '../config'
import { checkCode } from '../common/Utils'
import User from '../model/User'
import SignRecord from '../model/SignRecord'
import uuid from 'uuid/v4';
import { setValue } from '../config/RedisConfig'

class LoginController {
  async forget(ctx) {
    const { body } = ctx.request
    const sid = body.sid
    const code = body.code
    const result =await checkCode(sid, code)
    const user = await User.findOne({username: body.username})
    if (result) {
      if (user) {
      const key = uuid()
      setValue(key, jsonwebtoken.sign({ _id: user._id }, config.JWT_SERCET, {
        expiresIn: '30m'
      }))
      const result1 = await send({
        type: 'forget',
        code: '',
        data: {
          key: key,
          username: body.username
        },
        expire: moment()
          .add(30, 'minutes')
          .format('YYYY-MM-DD HH:mm:ss'),
        email: body.username,
        user: user.name
       })
       ctx.body = {
        code: 200,
        msg: '邮件发送成功,请查收更改密码'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '用户名不存在'
      }
    }
    } else {
      ctx.body = {
        code: 401,
        msg: '图片验证码不正确或已失效'
      }
   }
  }

  async login (ctx) {
  const { body } = ctx.request
  let sid = body.sid
  let code = body.code
  let result =await checkCode(sid, code)
  if (result) {
    let checkUserPasswd = false
    let user = await User.findOne({username: body.username})
    if (bcrypt.compare(body.password, user.password)) {
      checkUserPasswd = true
    }
    if (checkUserPasswd) {
      //取到json数据
      const userObj = user.toJSON()
      //屏蔽掉不需要传给前端的数据,然后删除
      const arr = ['password', 'username', 'roles']
      arr.map((item) => {
        delete userObj[item]
      })

      const token = jsonwebtoken.sign({ _id: userObj._id},
      config.JWT_SERCET, {
      expiresIn: "7d"
      })
      const signRecord = await SignRecord.findByUid(userObj._id)
      if ( signRecord !== null) {
        if ( moment(signRecord.created).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')) {
          userObj.isSign = true
        } else {
          userObj.isSign = false
        }
      } else {
        userObj.isSign = false
      }
      ctx.body = {
        code: 200,
        token: token,
        data: userObj
      }
    } else {
      ctx.body = {
        code: 404,
        msg: '用户名/密码验证失败'
      }
    }
    
  } else {
    ctx.body = {
      code: 401,
      msg: '图片验证码不正确或已失效'
    }
  }
  
  }

  async reg (ctx) {
    let { body } = ctx.request
    let sid = body.sid
    let code = body.code
    let msg = {}
    let result = await checkCode(sid, code)
    let check = true
    if (result) {
      let user1 = await User.findOne({ username: body.username })
      if (user1 !== null && typeof user1.username !== 'undefined') {
        msg.username = ['此邮箱已被注册,可以通过忘记密码找回']
        check = false
      }
      let user2 = await User.findOne({ name: body.name })
      if (user2 !== null && typeof user2.name !== 'undefined') {
        msg.name = ['此昵称已被注册']
        check = false
      }
      if (check) {
        body.password = await bcrypt.hash(body.password, 5)
        let user = new User({
          username: body.username,
          name: body.name,
          password: body.password,
          created: moment().format('YYYY-MM-DD HH:mm:ss')
        })
        let result = await user.save()
        ctx.body = {
          code: 200,
          data: result,
          msg:'注册成功'
        }
        return
      }
    } else {
      msg.code=['图片验证码不正确或已失效']
    }
    ctx.body = {
      code: 500,
      msg: msg
    }
  }
}

export default new LoginController()
