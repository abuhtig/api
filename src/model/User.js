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
favs:	{type: Number, default: 0 },
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
      password: 0,
      username: 0,
      mobile: 0
    })
  }
}
const UserModel = mongoose.model('users', UserSchema)

export default UserModel