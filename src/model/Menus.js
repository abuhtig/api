import mongoose from '../config/DBHelpler'
const Schema = mongoose.Schema

const MenuSchema = new Schema({
  title: { type: String, default: '' },
  name: { type: String, default: '' },
  path: { type: String, default: '' },
  component: { type: String, default: '' },
  hidelnBread: { type: Boolean, default: false },
  hidelnMenu: { type: Boolean, default: false },
  notCache: { type: Boolean, default: false },
  icon: { type: String, default: '' },
  sort: { type: String, default: '' },
  link: { type: String, default: '' },
  redirect: { type: String, default: '' },
  children: { type: String, default: '' },
  type: { type: String, default: '' },
  expand: { type: Boolean, default: true}
})

const OperationSchema = new Schema({
  name: { type: String, default: '' },
  type: { type: String, default: '' },
  method: { type: String, default: '' },
  path: { type: String, default: '' },
  regmark: { type: String, default: '' }
})
// LabelSchema.pre('save', function (next) {
//   this.created = moment().format('YYYY-MM-DD HH:mm:ss')
//   next()
// })

MenuSchema.add({
  children: [MenuSchema],
  operations: [OperationSchema]
})

const Menu = mongoose.model('menus', MenuSchema)

export default Menu