import mongoose from '../config/DBHelpler'
import moment from 'dayjs'
const Schema = mongoose.Schema

const CollectSchema = new Schema({
  tid: { type: String, ref: 'post' },
  uid: { type: String, ref: 'users'},
  title: { type: String },
  created: { type: Date }
})

CollectSchema.pre('save', function (next) {
  this.created = moment().format('YYYY-MM-DD HH:mm:ss')
  next()
})

CollectSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('There was a duplicate key error'))
  } else {
    next(error)
  }
})

CollectSchema.statics = {
  getListByUid: function (id, page, limit) {
    return this.find({uid: id}).skip(page * limit).limit(limit).sort({created: -1})
  },
  countByUid: function (id) {
    return this.find({ uid: id }).countDocuments()
  }
}

const Comments = mongoose.model('collects', CollectSchema)

export default Comments