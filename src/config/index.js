import path from 'path'
const DB_URL = 'mongodb://test:password@120.48.21.232:39875/testdb'
const REDIS = {
  host: '120.48.21.232',
  port: 6379,
  password: '123456'
}
const JWT_SERCET = 'F&l8mWkDt$9a1lQBuaej9oJ2T35@u7ur69szx6smKJINzMbUYjHxiFd*1KxpJ8zH'

const baseUrl = 'https://www.toped.top'

const uploadPath = process.env.NODE_ENV === 'production' ? 'public' : 
path.join(path.resolve(__dirname), '../../public')

const adminEmail = ['378091429@qq.com']

const publicPath = [/^\/public/, /\/login/,/^\/content/]

const AppId = 'wx45c9da8b092c8330'

const AppSecret = '8dad43e742ce7fec101bb1df8651cd7c'

export default {
  DB_URL,
  REDIS,
  JWT_SERCET,
  baseUrl,
  uploadPath,
  adminEmail,
  publicPath,
  AppId,
  AppSecret
}