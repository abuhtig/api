import path from 'path'
const DB_URL = 'mongodb://user:password@127.0.0.1:27017/testdb'
const REDIS = {
  host: '127.0.0.1',
  port: 6379,
  password: '123456'
}
const JWT_SERCET = 'F&l8mWkDt$9a1lQBuaej9oJ2T35@u7ur69szx6smKJINzMbUYjHxiFd*1KxpJ8zH'

const baseUrl = 'http://localhost:8082'

const uploadPath = process.env.NODE_ENV === 'production' ? '/app/public' : 
path.join(path.resolve(__dirname), '../../public')

export default {
  DB_URL,
  REDIS,
  JWT_SERCET,
  baseUrl,
  uploadPath
}