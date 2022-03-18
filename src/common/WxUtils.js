import axios from 'axios'
import config from '../config/index'
import WXBizDataCrypt from './WXBizDataCrypt'
import crypto from 'crypto'

export const wxGetUserInfo = async (code, user) => {
  const obj = await axios.get(`https://api.weixin.qq.com/sns/jscode2session?appid=${config.AppId}&secret=${config.AppSecret}&js_code=${code}&grant_type=authorization_code`)
  if (obj.status === 200 && obj.data.session_key) {
    const sessionKey = obj.data.session_key
    const { rawData, signature, encryptedData, iv } = user
    const sha1 = crypto.createHash('sha1')
    sha1.update(rawData)
    sha1.update(sessionKey)
    if (sha1.digest('hex') !== signature) {
      return Promise.reject(new Error({
        code: 500,
        msg: '签名校验失败,去检查'
      }))
    }
    const pc = new WXBizDataCrypt(config.AppId, sessionKey)
    return pc.decryptData(encryptedData, iv)
  } else {
    throw new Error(obj.data && obj.data.errmsg ? obj.data.errmsg : "请求微信接口失败")
  }
}