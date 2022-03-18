import { getValue } from '../config/RedisConfig'
import config from '../config/index'
import jwt from 'jsonwebtoken'

const getJWTPayload = token => {
  return jwt.verify(token.split(' ')[1], config.JWT_SERCET)
}

const generateToken = (payload) => {
  if (payload) {
    return jwt.sign({
      ...payload
    }, config.JWT_SERCET, { expiresIn: '7d' })
  } else {
    throw new Error('生成token失败!')
  }
}
const checkCode = async (key, value) => {
  const redisData = await getValue(key)
  if (redisData != null) {
    if (redisData.toLowerCase() == value.toLowerCase()) {
      return true
    } else {
      return false
    }
  } else {
    return false
  }
}
const sortObj = (arr, property) => {
  return arr.sort((m, n) => m[property] - n[property])
}

const getMenuData = (tree, rights, flage) => {
  const arr = []
  for (let index = 0; index < tree.length; index++) {
    const item = tree[index]
      if (rights.includes(item._id) || flage) {
        if (item.type === 'menu') {
        arr.push({
          _id: item._id,
          path: item.path,
          meta:{
            title: item.title,
            hidelnBread:item.hidelnBread,
            hidelnMenu:item.hidelnMenu,
            notCache:item.notCache,
            icon:item.icon
          },
          component: item.component,
          children: getMenuData(item.children, rights)
        })
      } else if (item.type === 'link'){
        arr.push({
          _id: item._id,
          path: item.path,
          meta:{
            title: item.title,
            icon:item.icon,
            href: item.link
          }
        })
      }
    }
  }
  return sortObj(arr, 'sort')
}

const getRights = (tree, menus) => {
    let arr = []
    for (const i of tree) {
      if (i.operations && i.operations.length > 0) {
        for (const j of i.operations) {
          if (menus.includes(j._id + '')) {
            arr.push(j.path)
          }
        }
      } else if (i.children && i.children.length > 0) {
        arr.push(getRights(i.children, menus))
      }
    }
    return arr.flat(Infinity)
}
const rand = () => {
  const str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghigklmnopqrstuvwxyz0123456789'
  let text = ''
  for (let index = 0; index < 9; index++) {
    text += str.charAt(Math.floor(math.random()))
  }
  return text
}

const getTempName = () => {
  return 'temp_' + rand() + '@js.com'
}
export{
  checkCode,
  getJWTPayload,
  getMenuData,
  sortObj,
  getRights,
  getTempName,
  generateToken
}