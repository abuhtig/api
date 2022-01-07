import Links from '../model/Links'
import Post from '../model/Post'
import Label from '../model/label'
import fs from 'fs'
import uuid from 'uuid/v4'
import moment from 'dayjs';
import config from '../config'
import mkdir from 'make-dir'
import User from '../model/User'
import { getJWTPayload } from '../common/Utils'
import { checkCode } from '../common/Utils'
import collect from '../model/Collect'
import qs from 'qs'

class ContentController {
  async getPostList (ctx) {
    const body = ctx.query
    const sort = body.sort ? body.sort : 'created'
    const page = body.page ? parseInt(body.page) : 0
    const limit = body.limit ? parseInt(body.limit) : 20
    const options = {}
    if (typeof body.catalog !== 'undefined' && body.catalog !== '') {
      options.catalog = body.catalog
    }
    if (typeof body.isTop !== 'undefined') {
      options.isTop = body.isTop
    }
    if (typeof body.status !== 'undefined' && body.status !== '') {
      options.status = body.status
    }
    if (typeof body.tag !== 'undefined' && body.tag !== '') {
      options.tags ={ $elemMatch: {name: body.tag } }
    }
    if (typeof body.search !== 'undefined' && body.search !== '') {
      options['content'] = {$regex: new RegExp(body.search)}
    }
    const result = await Post.getList(options, sort, page, limit)
    const total = await Post.getListCount(options)
    ctx.body = {
      code: 200,
      data: result,
      msg: '获取文章列表成功',
      total: total
    }
  }
  async getPostListadm (ctx) {
    const params = ctx.query
    let body = qs.parse(params)
    // const sort = body.sort ? body.sort : 'created'
    const page = body.page ? parseInt(body.page) : 0
    const limit = body.limit ? parseInt(body.limit) : 20
    const op = body.option || {}
    let option = qs.parse(op)
    if (option.search === 'name') {
      const user = await User.getUser(option)
      option.item = user.map(o => o._id)
    }
    const result = await Post.getListadm(option, page, limit)
    const total = await Post.countList(option)
    ctx.body = {
      code: 200,
      data: result,
      msg: '获取文章列表成功',
      total: total
    }
  }

  async getTopList(ctx) {
    const result = await Post.getTopList()
    ctx.body = {
      code: 200,
      data: result
    }
  }

  async getLinks(ctx) {
    const result = await Links.find({ type: 'links'})
    ctx.body = {
      code: 200,
      data: result
    }
  }

  async getTips(ctx) {
    const result = await Links.find({ type: 'tips'})
    ctx.body = {
      code: 200,
      data: result
    }
  }

  async getTopWeek (ctx) {
    const result = await Post.getTopWeek()
    ctx.body = {
      code: 200,
      data: result
    }
  }

  async uploadImg (ctx) {
    const file = ctx.request.files.file
    const ext = file.name.split('.').pop()
    const dir = `${config.uploadPath}/${moment().format('YYYYMMDD')}`
    await mkdir(dir)
    const picname = uuid()
    const destPath = `${dir}/${picname}.${ext}`
    const reader = fs.createReadStream(file.path)
    const upStream = fs.createWriteStream(destPath)
    const filePath = `/${moment().format('YYYYMMDD')}/${picname}.${ext}`
    reader.pipe(upStream)
    const obj = await getJWTPayload(ctx.header.authorization)
    const user = await User.findOne({ _id: obj._id})
    if (user.pic !== '/img/touxiang.jpeg') {
      let str = user.pic
      const link = config.uploadPath + str.substr(21)
      fs.unlink(link, (err) => {
        if (err) throw err
        console.log(link + 'was deleted')
      })
    }
    ctx.body = {
      code: 200,
      msg: '上传成功!',
      data: filePath
    }
  }

  async uploadWangImg (ctx) {
    const file = ctx.request.files.file
    const ext = file.name.split('.').pop()
    const dir = `${config.uploadPath}/${moment().format('YYYYMMDD')}`
    await mkdir(dir)
    const picname = uuid()
    const destPath = `${dir}/${picname}.${ext}`
    const reader = fs.createReadStream(file.path)
    const upStream = fs.createWriteStream(destPath)
    const filePath = `/${moment().format('YYYYMMDD')}/${picname}.${ext}`
    reader.pipe(upStream)
    ctx.body = {
      code: 200,
      msg: '上传成功!',
      data: filePath
    }
  }
  async addPost (ctx) {
    const { body } = ctx.request
    const sid = body.sid
    const code = body.code
    const result =await checkCode(sid, code)
    if (result) {
      const obj = await getJWTPayload(ctx.header.authorization)
      const user = await User.findById({ _id: obj._id })
      if (user.favs < body.fav) {
        ctx.body = {
          code: 501,
          msg: '积分不足'
        }
        return
      } else {
        const r = await User.updateOne({ _id: obj._id }, { $inc: { favs:-body.fav }})
        const newPost = new Post(body)
        newPost.uid = obj._id
        const result = await newPost.save()
        ctx.body = {
          code: 200,
          msg: '发帖成功'
        }
      }
    } else {
      ctx.body = {
        code: 401,
        msg: '图片验证码不正确或已失效'
      }
    }
  }
  
  async getPostDetail (ctx) {
    const params = ctx.query
    if (!params.tid) {
      ctx.body = {
        code: 500,
        msg: '文章标题为空'
      }
      return
    }

    const post = await Post.findByTid(params.tid)
    if (!post && typeof post != "undefined" && post != 0) {
      ctx.body = {
        code: 501,
        msg: '文章不存在'
      }
      return
    }
    let isCollect = false
    if (typeof ctx.header.authorization !== 'undefined' && ctx.header.authorization !== '') {
      const obj = await getJWTPayload(ctx.header.authorization)
      const userCollect = await collect.findOne({ uid: obj._id, tid: params.tid})
      if (userCollect && userCollect.tid) {
        isCollect = true
      }
    }
    const newPost = post.toJSON()
    newPost.isCollect = isCollect
    ctx.body = {
      code: 200,
      data: newPost,
      msg: '查询文章成功'
    }
  }

  async editPost (ctx) {
    const { body } = ctx.request
    const obj = await getJWTPayload(ctx.header.authorization)
    const post = await Post.findOne({ _id: body.tid })
    if (post.uid === obj._id && post.isEnd === '0') {
      const result = await Post.updateOne({ _id: body.tid }, body)
      if (result.ok === 1) {
        ctx.body = {
          code: 200,
          data: result,
          msg: '更新帖子成功'
        }
      } else {
        ctx.body = {
          code: 500,
          data: result,
          msg: '更新帖子失败'
        }       
      }
    } else {
      ctx.body = {
        code: 401,
        msg: '修改失败'
      }
    }
  }

  async editPostbyId (ctx) {
    const { body } = ctx.request
    const result = await Post.updateOne({ _id: body._id }, body)
    if (result.ok === 1) {
      ctx.body = {
        code: 200,
        data: result,
        msg: '更新帖子成功'
      }
      } else {
        ctx.body = {
          code: 500,
          data: result,
          msg: '更新帖子失败'
        }       
      }
  }

  async getPostListByUid (ctx) {
    const params = ctx.query
    const obj = await getJWTPayload(ctx.header.authorization)
    const result = await Post.getListByUid(obj._id, params.page, 10)
    const total = await Post.countByUid(obj._id)
    if (result.length> 0) {
      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: result,
        total
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '请求失败'
      }
    }
  }

  async deletePostByTid(ctx) {
    const params = ctx.query
    const obj = await getJWTPayload(ctx.header.authorization)
    const post = await Post.findOne({ uid: obj._id, _id: params.tid })
    if (post.uid === obj._id) {
      const result = await Post.deleteOne({ _id: params.tid })
      const result1 = await collect.deleteOne({ tid: params.tid})
      if (result.ok === 1 && result1.ok === 1) {
        ctx.body = {
          code: 200,
          msg: '删除成功'
        }
      } else {
        ctx.body = {
          code: 500,
          msg: '删除失败'
        }
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '删除失败,无权限'
      }
    }
  }

  async getColleByUid(ctx) {
    const params = ctx.query
    const obj = await getJWTPayload(ctx.header.authorization)
    const result = await collect.getListByUid(obj._id, params.page, 10)
    const total = await collect.countByUid(obj._id)
    if (result.length> 0) {
      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: result,
        total
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '请求失败'
      }
    }
  }

  async deletepost(ctx) {
    const params = ctx.query
    const result = await Post.deleteOne({ _id: params.tid })
    const result1 = await collect.deleteOne({ tid: params.tid})
    if (result.ok === 1 && result1.ok === 1) {
      ctx.body = {
        code: 200,
        msg: '删除成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '删除失败'
      }
    }
  }
  async deleteposts(ctx) {
    const { body } = ctx.request
    const result = await Post.deleteMany({ _id: { $in: body } })
    const result1 = await collect.deleteMany({ tid: { $in: body } })
    if (result.ok === 1 && result1.ok === 1) {
      ctx.body = {
        code: 200,
        msg: '删除成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '删除失败'
      }
    }
  }

  async batchUpdatePosts (ctx) {
    const { body } = ctx.request
    const result = await Post.updateMany({_id: { $in: body.ids }}, { $set: {...body.set} })
    if (result.ok === 1) {
      ctx.body = {
        code: 200,
        data: result
      }
    }
  }

  async getLabel (ctx) {
    const params = ctx.query
    const body = qs.parse(params)
    const sort = body.sort ? body.sort : 'created'
    const page = body.page ? parseInt(body.page) : 0
    const limit = body.limit ? parseInt(body.limit) : 10
    const option = body.option || {}
    const result = await Label.getLabel(sort, page, limit, option)
    const total = await Label.countList(option)
    ctx.body = {
      code: 200,
      data: result,
      msg: '获取文章列表成功',
      total: total
    }
  }

  async addLabel(ctx) {
    const { body } = ctx.request
    const newPost = new Label(body)
    const result = await newPost.save()
    ctx.body = {
      code: 200,
      data: result,
      msg: '新增成功'
    }
  }

  async deleteLabel(ctx) {
    const params = ctx.query
    const result = await Label.deleteOne({ _id: params._id })
    // 将文章评论一起删除
    const result1 = await collect.deleteOne({ tid: params._id})
    if (result.ok === 1 && result1.ok === 1) {
      ctx.body = {
        code: 200,
        msg: '删除成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '删除失败'
      }
    }
  }

  async editLabel(ctx) {
    const { body } = ctx.request
    const result = await Label.updateOne({ _id: body._id }, body)
    if (result.ok === 1) {
      ctx.body = {
        code: 200,
        data: result,
        msg: '更新帖子成功'
      }
      } else {
        ctx.body = {
          code: 500,
          data: result,
          msg: '更新帖子失败'
        }       
      }
  }
}

export default new ContentController()