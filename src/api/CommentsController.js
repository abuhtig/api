import Comments from '../model/Comments'
import { getJWTPayload } from '../common/Utils'
import PostModel from '../model/Post'
import User from '../model/User'
import CommentsHands from '../model/CommentsHands';

const canReply = async (ctx) => {
  let result = true
  const obj = await getJWTPayload(ctx.header.authorization)
  if (typeof obj._id === 'undefined') {
    return result
  } else {
    const user = await User.findByID(obj._id)
    if (user.status === '0') {
      result = false
    }
    return result
  }
}
class CommentsController {
  async getComments (ctx) {
    const params = ctx.query
    const tid = params.tid
    const page = params.page ? params.page : 0
    // 返回每页的条数
    const limit = 10
    let result = await Comments.getCommentsList(tid, page, limit)
    const total = await Comments.queryCont(tid)
    let obj = {}
    if (typeof ctx.header.authorization !== 'undefined') {
      obj = await getJWTPayload(ctx.header.authorization)
    }
    if (typeof obj !== 'undefined') {
      result = result.map(item => item.toJSON())
      for ( let i = 0; i< result.length; i++) {
        let item = result[i]
        item.handed = '0'
        const commentsHands = await CommentsHands.findOne({ cid: item._id, uid: obj._id })
        if (commentsHands && commentsHands.cid) {
          if (commentsHands.uid === obj._id) {
            item.handed = '1'
          }
        }
      }
    }
    // const post = await PostModel.findByTid(params.tid)
    // 浏览数自增
    const result11 = await PostModel.updateOne({ _id: params.tid }, { $inc: { reads: 1 } })
    if (result11.ok === 1) {
      ctx.body = {
        code: 200,
        total,
        data: result,
        msg: '查询成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '查询失败'
      }
    }
  }

  async addComment (ctx) {
    const check = await canReply(ctx)
    if (check) {
      ctx.body = {
        code: 500,
        msg: '用户已被禁言!'
      }
      return
    }
    const { body } = ctx.request
    const newComment = new Comments(body)
    const obj = await getJWTPayload(ctx.header.authorization)
    newComment.cuid = obj._id
    const post = await PostModel.findOne({ _id: body.tid })
    newComment.uid = post.uid
    const comment = await newComment.save()
    const num = await Comments.getTotal(post.uid)
    global.ws.send(post.uid, JSON.stringify({
      event: 'message',
      msg: num
    }))
    const result = await PostModel.updateOne({ _id: body.tid }, { $inc: { answer: 1 } })
    if (result.ok === 1) {
      ctx.body = {
        code: 200,
        data: comment,
        msg: '评论成功'
      }
    } else {
      ctx.body = {
        code: 500,
        data: comment,
        msg: '评论失败'
      }
    }
  }
// 设置提问贴的最佳回复
  async setBest (ctx) {
    // 验证用户是否合法
    const obj = await getJWTPayload(ctx.header.authorization)
    if (typeof obj === 'undefined' && obj._id !== '') {
      ctx.body = {
        code: 401,
        msg: '用户未登录,或者未授权'
      }
      return
    }
    const params =ctx.query
    const post = await PostModel.findOne({ _id: params.tid })
    const comment = await Comments.findByCid(params.cid)
    if (comment.cuid === obj._id) {
      ctx.body = {
        code: 500,
        msg: '不能给自己的评论设置最佳'
      }
      return
    }
    if (post.uid === obj._id && post.isEnd === '0') {
      const result = await PostModel.updateOne({ _id: params.tid }, { $set: { isEnd: '1' } })
      const result1 = await Comments.updateOne({ _id: params.cid }, { $set: { isBest: '1'} })
      if (result.ok === 1 && result1.ok === 1) {
        // 给最佳回复增加悬赏的积分
        const result2 = await User.updateOne({ _id: comment.cuid }, { $inc: { favs: parseInt(post.fav) } })
        if (result2.ok ===1) {
          ctx.body = {
            code: 200,
            msg: '设置成功'
          }
        } else {
          ctx.body = {
            code: 500,
            msg: '设置失败'
          }
        }
      } else {
        ctx.body = {
          code: 500,
          msg: '设置失败'
        }
      }
    }else {
      ctx.body = {
        code: 500,
        msg: '帖子已结贴或重复设置'
      }
    }
  }

  async setHands (ctx) {
    const obj = await getJWTPayload(ctx.header.authorization)
    const params = ctx.query
    const tmp = await CommentsHands.find({ cid: params.cid, uid: obj._id })
    if (tmp.length > 0) {
      ctx.body = {
        code: 500,
        msg: '重复点赞'
      }
      return
    }
    const newHands = new CommentsHands({
      cid: params.cid,
      uid: obj._id
    })
    await newHands.save()
    const result = await Comments.updateOne({ _id: params.cid }, { $inc: { hands: 1 } })
    if (result.ok === 1) {
      ctx.body = {
        code: 200,
        msg: '点赞成功'
      }   
    } else {
      ctx.body = {
        code: 500,
        msg: '点赞失败'
      }
    }
  }
}

export default new CommentsController()