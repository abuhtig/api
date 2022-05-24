import path from 'path'
const DB_URL = ''
const REDIS = {
  host: '',
  port:  '',
  password: ''
}
const JWT_SERCET = ''

const baseUrl = 'https://www.toped.top'

const uploadPath = process.env.NODE_ENV === 'production' ? 'public' : 
path.join(path.resolve(__dirname), '../../public')

const adminEmail = ['378091429@qq.com']

const publicPath = [/^\/public/, /\/login/,/^\/content/]

const AppId = ''

const AppSecret = ''

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
