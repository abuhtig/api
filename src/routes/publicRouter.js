import Router from 'koa-router'
import publicController from '../api/PublicController'
import listController from '../api/ContentController'
import userController from '../api/UserController'
import commentsController from '../api/CommentsController';
const router = new Router()

router.prefix('/public')
router.get('/list', listController.getPostList)
router.get('/getCaptcha', publicController.getCaptcha)
router.get('/tips', listController.getTips)
router.get('/links', listController.getLinks)
router.get('/topWeek', listController.getTopWeek)
router.get('/setEmail', userController.updateUsername)
router.get('/setPass', userController.updateUserpass)
router.get('/content/detail', listController.getPostDetail)
router.get('/comments', commentsController.getComments)

export default router
