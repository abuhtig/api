import mongoose from '../config/DBHelpler'
import moment from 'dayjs'
const Schema = mongoose.Schema

const UserSchema = new Schema({
username: {type: String, index: {unique: true }, sparse: true },
//	用户名，这个是邮件账号
password:	{type: String },
//	密码
name:	{type: String },
//	昵称
created: {type: Date },
//)	注册时间
updated:	{type: Date },
//)	更新时间
favs:	{type: Number, default: 10 },
//100	用户积分
gender:	{type: String },
//	默认，0-男， 1-女
roles: {type: Array, default:['user'] },
//user	角色, user-普通用户，admin-管理员, super_admin超级管理员
pic: {type: String, default:'/img/touxiang.jpeg' },
//	用户的头像
mobile:	{type: String, match: /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/ },
//	手机号码
status:	{type: String, default: '0' },
//0	是否被禁用，0-正常，1-禁言，2-账号禁用
regmark: {type: String, default: '' },
//	个性签名
location:	{type: String, default: '' },
//	城市
isVip: {type: String, default: '0' },
//0	是否是Vip用户， 0-普通用户，1-会员用户，2-7 定义成vip的level
count: {type: Number, default: '0' },
//0	签到次数
})

UserSchema.pre('save', function (next) {
  this.created = moment().format('YYYY-MM-DD HH:mm:ss')
  next()
})

UserSchema.pre('update', function (next) {
  this.update = moment().format('YYYY-MM-DD HH:mm:ss')
  next()
})

UserSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('Error: Monngoose has a duplicate key.'))
  } else {
    next(error)
  }
})

UserSchema.statics = {
  findByID: function (id) {
    return this.findOne({_id: id},{
      updated: 0,
      username: 0,
      gender: 0
    })
  },
  getList: function (page, limit, option) {
    let query = {}
    if (typeof option.item !== 'undefined' && option.item.trim() !== '') {
      if (option.search === 'created') {
        const start = option.item[0]
        const end = option.item[1]
        query = { created: { $gte: new Date(start), $lt: new Date(end) }}
      } else if (option.search === 'roles') {
        query = { roles: { $in: option.item } }
      } else if (['name', 'username'].includes(option.search)) {
        query[option.search] = {$regex: new RegExp(option.item)}
      } else {
        query[option.search] = option.item
      }
    }

    return this.find(query,{
      password: 0,
      pic: 0,
      count: 0,
      regmark: 0
    }).skip(page * limit)
    .limit(limit)
  },
  getListCount: function (option) {
    let query = {}
    if (typeof option.item !== 'undefined' && option.item.trim() !== '') {
      if (option.search === 'created') {
        const start = option.item[0]
        const end = option.item[1]
        query = { created: { $gte: new Date(start), $lt: new Date(end) }}
      } else if (option.search === 'roles') {
        query = { roles: { $in: option.item } }
      } else if (['name', 'username'].includes(option.search)) {
        query[option.search] = {$regex: new RegExp(option.item)}
      } else {
        query[option.search] = option.item
      }
    }
    return this.find(query).countDocuments()
  },

  getUser: function (option) {
    return this.find({name: {$regex: new RegExp(option.item)}}, {_id: 1})
  }
}
const UserModel = mongoose.model('users', UserSchema)

export default UserModel