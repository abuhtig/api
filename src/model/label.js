import mongoose from '../config/DBHelpler'
import moment from 'dayjs'
const Schema = mongoose.Schema

const LabelSchema = new Schema({
  classname: { type: String },
  name: { type: String },
  created: { type: Date },
})

LabelSchema.pre('save', function (next) {
  this.created = moment().format('YYYY-MM-DD HH:mm:ss')
  next()
})

LabelSchema.statics = {
  getLabel: function (sort, page, limit, option) {
    let query = {}
    if (typeof option.item !== 'undefined' && option.item.trim() !== '') {
      if (option.search === 'created') {
        const start = option.item[0]
        const end = option.item[1]
        query = { created: { $gte: new Date(start), $lt: new Date(end) }}
      }else if (option.search === 'name') {
        query[option.search] = {$regex: new RegExp(option.item)}
      } else {
        query[option.search] ={ $in: option.item }
      }
    }
    return this.find(query)
    .sort({[sort]: -1})
    .skip(page * limit)
    .limit(limit)
  },
  countList: function (option) {
    let query = {}
    if (typeof option.item !== 'undefined' && option.item.trim() !== '') {
      if (option.search === 'created') {
        const start = option.item[0]
        const end = option.item[1]
        query = { created: { $gte: new Date(start), $lt: new Date(end) }}
      }else if (option.search === 'name') {
        query[option.search] = {$regex: new RegExp(option.item)}
      } else {
        query[option.search] ={ $in: option.item }
      }
    }
    return this.find(query).countDocuments()
  }
}

const CommentsHands = mongoose.model('label', LabelSchema)

export default CommentsHands