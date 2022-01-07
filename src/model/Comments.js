import mongoose from '../config/DBHelpler'
import moment from 'dayjs'
const Schema = mongoose.Schema

const CommentsSchema = new Schema({
  tid: { type: String, ref: 'post' },
  cuid: { type: String, ref: 'users'},
  content: { type: String },
  created: { type: Date },
  hands: { type: Number, default: 0 },
  status: { type: String, default: '1' },
  isRead: { type: String, default: '0' },
  isBest: { type: String, default: '0' },
})

CommentsSchema.pre('save', function (next) {
  this.created = moment().format('YYYY-MM-DD HH:mm:ss')
  next()
})

CommentsSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('There was a duplicate key error'))
  } else {
    next(error)
  }
})

CommentsSchema.statics = {
  findByTid: function (id) {
    return this.find({ tid: id })
  },
  findByCid: function (id) {
    return this.findOne({ _id: id })
  },
  getCommentsList: function (id, page, limit) {
    return this.find({ tid: id }).populate({
      path: 'cuid',
      select: '_id name pic isVip',
      match: { status: { $eq: '0' } }
    }).populate({
      path: 'tid',
      select: '_id uid status'
    }).skip(page * limit).limit(limit)
  },
  getList: function (page, limit, option) {
    let query = {}
    let query2 = {}
    let query3 = {}
    if (typeof option.item !== 'undefined' && option.item.trim() !== '') {
      if (option.search === 'created') {
        const start = option.item[0]
        const end = option.item[1]
        query = { created: { $gte: new Date(start), $lt: new Date(end) }}
      } else if (option.search === 'status') {
        query = { status: { $eq: option.item } }
      } else if (option.search === 'isRead') {
        query = { isRead: { $eq: option.item } }
      } else if (option.search === 'isBest') {
        query = { isBest: { $eq: option.item } }
      } else if (option.search === 'content') {
        query[option.search] = {$regex: new RegExp(option.item)}
      } else if (option.search === 'title') {
        query2[option.search] = {$regex: new RegExp(option.item)}
      } else if (option.search === 'user') {
        query3[option.search] = {$regex: new RegExp(option.item)}
      } else {
        query[option.search] = option.item
      }
    }
    return this.find(query).populate({
      path: 'cuid',
      select: '_id name',
      match: query3
    }).populate({
      path: 'tid',
      select: '_id title',
      match: query2
    }).skip(page * limit).limit(limit)
  },
  queryCont: function (id) {
    return this.find({ tid: id }).countDocuments()
  },
  getTotal: function (id) {
    return this.find({ cuid: id, isRead: '0', status: '1' }).countDocuments()
  },
  getTotalAll: function () {
    return this.find({ isRead: '0', status: '1' }).countDocuments()
  },
  getMsgList: function (id, page, limit) {
    return this.aggregate([
      {
        $lookup: {
          from: 'posts',
          let: { pid: {$toObjectId: "$tid"} },
          pipeline: [
            { $match: {$expr: {$eq: ['$_id', '$$pid']}} },
            { $project: {_id: 1, uid: 1, title: 1} }
          ],
          as: 'post'
        }
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects:[{ $arrayElemAt:['$post', 0]}, '$$ROOT']
          }
        }
      },
      { $addFields: { userId: {$toObjectId: "$uid"}}},
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'tuid'
        }
      },
      {$unwind: '$tuid'},
      // 添加objectid字段
      { $addFields: { fuserId: {$toObjectId: "$cuid"}}},
      {
        $lookup: {
          from: 'users',
          localField: 'fuserId',
          foreignField: '_id',
          as: 'fuid'
        }
      },
      {$unwind: '$fuid'},
      { $project: { post: 0, tuid: { username: 0,password: 0}, fuid: {username: 0,password: 0}, userId: 0, tid: 0, cuid: 0}},
      {$match: {uid:id,status: "1", isRead: "0"}}
    ]).skip(page * limit).limit(limit)
  }
}

const Comments = mongoose.model('comments', CommentsSchema)

export default Comments