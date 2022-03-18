import mongoose from '../config/DBHelpler'
import moment from 'dayjs'
const Schema = mongoose.Schema

const recordsSchema = new Schema({
  cuid: { type: String, ref: 'users'},
  records: { type: Array }
})

const ChildSchema = new Schema({
  created: { type: Date, default: '' },
  tid: { type: String, ref: 'post'},
  title: { type: String, default: '' }
})

ChildSchema.pre('save', function (next) {
  this.created = moment().format('YYYY-MM-DD HH:mm:ss')
  next()
})
recordsSchema.add({
  records: [ChildSchema]
})

const Records = mongoose.model('records', recordsSchema)

export default Records