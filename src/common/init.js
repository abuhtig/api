import config from '../config/index'
import User from '../model/User'
import {setValue} from '../config/RedisConfig'
export default async () => {
  if (config.adminEmail && config.adminEmail.length > 0) {
    const emails = config.adminEmail
    const arr = []
    for (const email of emails) {
      const user = await User.findOne({ username: email })
      arr.push(user._id)
    }
    setValue('admin', JSON.stringify(arr))
  }
}