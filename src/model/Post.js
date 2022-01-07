import mongoose from '../config/DBHelpler'
import moment from 'dayjs'
const Schema = mongoose.Schema

const PostSchema = new Schema({
  uid: { type: String, ref: 'users' },
  catalog: { type:String },
  title: { type: String },
  content: { type: String },
  created: { type: Date },
  fav: { type: String },
  isEnd: { type: String, default: '0' },
  reads: { type: Number, default: 0  },
  answer: { type: Number, default: 0  },
  status: { type: String, default: '0'  },
  isTop: { type: String, default: '0'  },
  sort: { type: String, default: 100  },
  tags: { type: Array, ref: 'label' }
})

PostSchema.pre('save', function (next) {
  this.created = moment().format('YYYY-MM-DD HH:mm:ss')
  next()
})

PostSchema.statics = {
  getList: function (options, sort, page, limit) {
    return this.find(options)
    .sort({[sort]: -1})
    .skip(page * limit)
    .limit(limit)
    .populate({
      path: 'uid',
      select: 'name isVip pic'
    })
  },
  getListCount: function (options) {
    return this.find (options).countDocuments()
  },
  getListadm: function (option, page, limit) {
    let query = {}
    if (typeof option.item !== 'undefined' && option.item !== '') {
      if (option.search === 'created') {
        const start = option.item[0]
        const end = option.item[1]
        query = { created: { $gte: new Date(start), $lt: new Date(end) }}
      } else if (option.search === 'catalog') {
        query = { catalog: { $in: option.item } }
      } else if (option.search === 'title') {
        query[option.search] = {$regex: new RegExp(option.item)}
      } else if (option.search === 'tags') {
        query = { tags:{ $elemMatch: { name: new RegExp(option.item) }}}
      } else if (option.search === 'name') {
        query = { uid: { $in: option.item }}
      } else {
        query[option.search] = option.item
      }
    }
    return this.find(query)
    .skip(page * limit)
    .limit(limit)
    .populate({
      path: 'uid',
      select: 'name isVip pic'
    })
    .sort({created: -1})
  },
  getTopWeek: function () {
    return this.find({
      "created": {
        $gte: moment().subtract(7, 'days')
      }
    },{
      answer: 1,
      title: 1
    }).sort({ answer: -1}).limit(15)
  },
  findByTid: function (id) {
    return this.findOne({ _id: id }).populate({
      path: 'uid',
      select: 'name pic isVip _id'
    })
  },
  getTopList: function () {
    return this.find({isTop:"1"})
  },
  getListByUid: function (id, page, limit) {
    return this.find({uid: id}).skip(page * limit).limit(limit).sort({created: -1})
  },
  countByUid: function (id) {
    return this.find({ uid: id }).countDocuments()
  },
  countList: function (option) {
    let query = {}
    if (typeof option.item !== 'undefined' && option.item !== '') {
      if (option.search === 'created') {
        const start = option.item[0]
        const end = option.item[1]
        query = { created: { $gte: new Date(start), $lt: new Date(end) }}
      } else if (option.search === 'catalog') {
        query = { catalog: { $in: option.item } }
      } else if (option.search === 'title') {
        query[option.search] = {$regex: new RegExp(option.item)}
      } else if (option.search === 'tags') {
        query = { tags:{ $elemMatch: { name: new RegExp(option.item) }}}
      } else if (option.search === 'name') {
        query = { uid: { $in: option.item }}
      } else {
        query[option.search] = option.item
      }
    }
    return this.find(query).countDocuments()
  }
}

const PostModel = mongoose.model('post', PostSchema)

export default PostModel