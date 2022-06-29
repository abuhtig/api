import svgCaptcha from 'svg-captcha'
import Label from '../model/label'
import { setValue, getHValue, getValue } from '../config/RedisConfig'
import Links from '../model/Links'
import axios from 'axios'

class PublicController {
  constructor() {}
  async getCaptcha(ctx) {
    const body = ctx.request.query
    const newCaptca = svgCaptcha.create({
      size: 4,
      ignoreChars: '0o1il',
      color: true,
      noise: Math.floor(Math.random() * 5),
      width: 150
    })
    if (body.sid) {
      setValue(body.sid, newCaptca.text, 600)
    }
    ctx.body = {
      code: 200,
      data: newCaptca.data,
    }
  }
  async getLabels (ctx) {
    const result = await Label.find({})
    ctx.body = {
      code: 200,
      data: result,
      msg: '获取文章标签成功'
    }
  }

  async getAdvert (ctx) {
    const result = await Links.find({})
    ctx.body = {
      code: 200,
      msg: '成功',
      data: result
    }
  }

  async tmdb (ctx) {
    const body = ctx.request.query
    const str = encodeURI(body.query)
    const obj = await axios.get('https://api.themoviedb.org/3/search/multi?api_key=b90928d70befc539d0d7949355b20714&language=zh&query=' + str)
    const res = obj.data.results
    ctx.body = {
      data: res
    }
  }

  async tmdbSimilar (ctx) {
    const body = ctx.request.query
    const str = encodeURI(body.query)
    const obj = await axios.get(`https://api.themoviedb.org/3/movie/${str}/similar?api_key=b90928d70befc539d0d7949355b20714&language=zh`)
    const res = obj.data.results.slice(0,6)
    res.map((item) => item.overview = '')
    ctx.body = {
      data: res
    }
  }
}

export default new PublicController()
