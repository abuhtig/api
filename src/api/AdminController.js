import Menu from '../model/Menus'
import Roles from '../model/Roles'
import Comments from '../model/Comments'
import User from '../model/User'
import Post from '../model/Post'
import logs from '../model/errorRecord'
import Sign from '../model/SignRecord'
import {getMenuData, sortObj, getRights} from '../common/Utils'
import dayjs from 'dayjs'
import config from '../config'
import mkdir from 'make-dir'
import uuid from 'uuid/v4'
import fs from 'fs'
import Links from '../model/Links'
let weekday = require('dayjs/plugin/weekday')
dayjs.extend(weekday)
class AdminController {
  async addMenu(ctx) {
    const { body } = ctx.request
    const menu = new Menu(body)
    const result = await menu.save()
    ctx.body = {
      code: 200,
      data: result
    }
  }
  async deleteMenu(ctx) {
    const params = ctx.query
    let result = await Menu.deleteOne({ _id: params._id })
    ctx.body = {
      code: 200,
      data: result
    }
  }
  async updataMenu(ctx) {
    const { body } = ctx.request
    const  data = { ...body }
    delete data._id
    const result = await Menu.updateOne({ _id: body._id }, { ...data })
    ctx.body = {
      code: 200,
      data: result
    }
  }
  async getMenus(ctx) {
    const result = await Menu.find({}).sort({sort: -1})
    const data = sortObj(result, 'sort')
    ctx.body = {
      code: 200,
      data: data
    }
  }
  async addRoles(ctx){
    const { body } = ctx.request
    const roles = new Roles(body)
    const result = await roles.save()
    ctx.body = {
      code: 200,
      data: result
    }
  }
  async deleteRoles(ctx){
    const params = ctx.query
    const result = await Roles.deleteOne({ _id: params._id })
    ctx.body = {
      code: 200,
      data: result
    }
  }
  async updataRoles(ctx){
    const { body } = ctx.request
    const data = { ...body }
    delete data._id
    const result = await Roles.updateOne({ _id: body._id }, { ...data })
    ctx.body = {
      code: 200,
      data: result
    }
  }
  async getRoles(ctx){
    const result = await Roles.find({})
    ctx.body = {
      code: 200,
      data: result
    }
  }
  async getRolesName (ctx) {
    const result = await Roles.find({},{menu: 0, desc: 0})
    ctx.body = {
      code: 200,
      data: result
    }
  }
  async getcomment (ctx) {
    const { body } = ctx.request
    const page = body.page ? parseInt(body.page) : 0
    const limit = body.limit ? parseInt(body.limit) : 10
    const option = body.option || {}
    let result = await Comments.getList(page, limit, option)
    if (option.search === 'user') {
      for (let index = 0; index < result.length; index++) {
        if (result[index].cuid !== null) {
          result = result.slice(index, index + 1)
        }
      }
    } else if (option.search === 'title') {
      for (let index = 0; index < result.length; index++) {
        if (result[index].tid !== null) {
          result = result.slice(index, index + 1)
        }
      }
    }
    const total = await Comments.getTotalAll()
    ctx.body = {
      code: 200,
      data: result,
      msg: '????????????????????????',
      total: total
    }
  }

  async editComment (ctx) {
    const { body } = ctx.request
    const data = { ...body }
    const result = await Comments.updateOne({ _id: body._id }, { ...data })
    ctx.body = {
      code: 200,
      data: result
    }
  }

  async deleteComment (ctx) {
    const params = ctx.query
    const result = await Comments.deleteOne({ _id: params._id })
    ctx.body = {
      code: 200,
      data: result
    }
  }
  async batchDeleteComment (ctx) {
    const { body } = ctx.request
    const result = await Comments.deleteMany({ _id: { $in: body } })
    if (result.ok === 1) {
      ctx.body = {
        code: 200,
        msg: '????????????'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '????????????'
      }
    }
  }

  async batchEditComment (ctx) {
    const { body } = ctx.request
    const result = await Comments.updateMany({_id: { $in: body.ids }}, { $set: {...body.data} })
    if (result.ok === 1) {
      ctx.body = {
        code: 200,
        data: result
      }
    }
  }
  // ????????????????????????
  async getRoutes (ctx) {
    const user = await User.findOne({ _id: ctx._id }, { roles: 1 })
    const { role } = user
    const rights = await Roles.findOne({ role }, { menu: 1 })
    const menus = rights.menu
    const treeData = await Menu.find({})
    const routes = getMenuData(treeData, menus, ctx.isAdmin)
    ctx.body = {
      code: 200,
      data: routes
    }
  }

  async getOperations (ctx) {
    const user = await User.findOne({ _id: ctx._id }, { roles: 1 })
    const { roles } = user
    const rights = await Roles.findOne({ roles }, { menu: 1 })
    const menus = rights.menu
    const treeData = await Menu.find({})
    const routes = getRights(treeData, menus)
    return routes
  }

  async getStats (ctx) {
    const inforData = []
    const nowZero = new Date().setHours(0, 0, 0, 0)
    const time = dayjs(nowZero).weekday(1).format()
    //????????????
    const user = await User.find({}).countDocuments()
    //??????????????????
    const userDiff = await User.find({ created: { $gte: time }}).countDocuments()
    const post = await Post.find({}).countDocuments()
    const postDiff = await User.find({ created: { $gte: time }}).countDocuments()
    const comm = await Comments.find({}).countDocuments()
    const commDiff = await Comments.find({ created: { $gte: time }}).countDocuments()
    // ???????????????????????????
    const readsData = await Post.find({},{ reads: 1, _id: 0 })
    let element = 0
    for (let index = 0; index < readsData.length; index++) {
      element += readsData[index].reads
    }
    const elementDiff = await Post.find({created: { $gte: time }},{ reads: 1, _id: 0 })
    let element1 = 0
    for (let index = 0; index < elementDiff.length; index++) {
      element1 += elementDiff[index].reads
    }
    //????????????,????????????
    const startTime = dayjs(nowZero).weekday(1).format()
    const endTime = dayjs(nowZero).weekday(8).format()
    const weekSign = await Sign.find({created:{ $gte: startTime, $lte: endTime }}).countDocuments()
    const weekPost = await Post.find({created:{ $gte: startTime, $lte: endTime }}).countDocuments()
    inforData.push([user, userDiff], [post, postDiff], [comm, commDiff], [element, element1], [weekSign, weekSign], [weekPost, weekPost])

    const postsBarData = await Post.aggregate([
      { $group: { _id: '$catalog', count: { $sum: 1 } } }
    ])
    let pieData = {}
    postsBarData.forEach((item) => {
      pieData[item._id] = item.count
    })

    const startMonth = dayjs(nowZero).subtract(5, 'M').date(1).format()
    const endMonth = dayjs(nowZero).add(1, 'M').date(1).format()
    let monthData = await Post.aggregate([
      { $match: { created: { $gte: new Date(startMonth), $lt: new Date(endMonth) } } },
      { $project: { month: { $dateToString: { format: '%Y-%m', date: '$created' } } } },
      { $group: { _id: '$month', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
    monthData = monthData.reduce((obj, item) => {
      return {
        ...obj,
        [item._id]: item.count
      }
    }, {})
    ctx.body = {
      code: 200,
      data: inforData,
      data2: pieData,
      data3: monthData
    }
  }

  async getLogs (ctx) {
    const body = ctx.query
    const page = body.page ? parseInt(body.page) : 0
    const limit = body.limit ? parseInt(body.limit) : 10
    const result = await logs.getList(page, limit)
    ctx.body = {
      code: 200,
      data: result
    }
  }

  async deleteLogs (ctx) {
    const { body } = ctx.request
    const result = await logs.deleteMany({_id: { $in: body.ids }})
    ctx.body = {
      code: 200,
      data: result
    }
  }

  async uploadImg (ctx) {
    const file = ctx.request.files.file
    const ext = file.name.split('.').pop()
    const dir = `${config.uploadPath}/advert`
    await mkdir(dir)
    const picname = uuid()
    const destPath = `${dir}/${picname}.${ext}`
    const reader = fs.createReadStream(file.path)
    const upStream = fs.createWriteStream(destPath)
    const filePath = `/advert/${picname}.${ext}`
    reader.pipe(upStream)
    ctx.body = {
      code: 200,
      msg: '????????????!',
      data: filePath
    }
  }

  async uploadAdvert (ctx) {
    const { body } = ctx.request
    const link = new Links(body)
    const result = await link.save()
    ctx.body = {
      code: 200,
      msg: '??????????????????',
      data: result
    }
  }
  async deleteAdvert (ctx) {
    const { body } = ctx.request
      const result = await Links.deleteMany({_id: { $in: body }})
      ctx.body = {
        code: 200,
        data: result
      }
  }
}


export default new AdminController()