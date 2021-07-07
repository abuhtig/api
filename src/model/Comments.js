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
  queryCont: function (id) {
    return this.find({ tid: id }).countDocuments()
  },
  getTotal: function (id) {
    return this.find({ cuid: id, isRead: '0', status: '1' }).countDocuments()
  },
  getComment: function () {
    
  }
}

const Comments = mongoose.model('comments', CommentsSchema)

export default Comments