import mongoose from '../config/DBHelpler'
import moment from 'dayjs'
const Schema = mongoose.Schema

const LogSchema = new Schema({
  message: { type: String, default: '' },
  code: { type: String, default: '' },
  method: { type: String, default: ''},
  path: { type: String, default: ''},
  param: { type: Schema.Types.Mixed, default: '' },
  username: { type: String, default: '' },
  stack: { type: String, default: '' },
  created: { type: Date },
})

LogSchema.pre('save', function (next) {
  this.created = moment()
  next()
})

LogSchema.statics = {
  getList: function (page, limit) {
    return this.find({}).skip(page * limit).limit(limit)
  }
}

const logs = mongoose.model('logs', LogSchema)

export default logs