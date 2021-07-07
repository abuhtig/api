import combineRoutes from 'koa-combine-routers'

import publicRouter from './publicRouter'
import loginRouter from './loginRouter'
import userRouter from './userRouter'
import contentRouter from './contentRouter'
import commenRouter from './commenRouter'

export default combineRoutes(publicRouter, loginRouter, userRouter, contentRouter, commenRouter)
