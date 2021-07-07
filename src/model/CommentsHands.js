import mongoose from '../config/DBHelpler'
import moment from 'dayjs'
const Schema = mongoose.Schema

const CommentsSchema = new Schema({
  uid: { type: String },
  cid: { type: String },
  created: { type: Date },
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
  findByCid: function (id) {
    return this.find({ cid: id })
  }
}

const CommentsHands = mongoose.model('Comments_Hands', CommentsSchema)

export default CommentsHands