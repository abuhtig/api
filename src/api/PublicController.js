import svgCaptcha from 'svg-captcha'
import { setValue, getHValue, getValue } from '../config/RedisConfig'

class PublicController {
  constructor() {}
  async getCaptcha(ctx) {
    const body = ctx.request.query
    console.log(body.sid)
    const newCaptca = svgCaptcha.create({
      size: 4,
      ignoreChars: '0o1il',
      color: true,
      noise: Math.floor(Math.random() * 5),
      width: 150
    })
    // console.log(newCaptca)
    setValue(body.sid, newCaptca.text, 600)
    ctx.body = {
      code: 200,
      data: newCaptca.data,
    }
  }
}

export default new PublicController()
