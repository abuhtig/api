import Router from 'koa-router'
import publicController from '../api/PublicController'
import listController from '../api/ContentController'
import userController from '../api/UserController'
import commentsController from '../api/CommentsController';
const router = new Router()

router.prefix('/public')
router.get('/list', listController.getPostList)
router.get('/adlist', listController.getPostListadm)
router.get('/topList', listController.getTopList)
router.get('/getCaptcha', publicController.getCaptcha)
router.get('/tips', listController.getTips)
router.get('/links', listController.getLinks)
router.get('/topWeek', listController.getTopWeek)
router.get('/setEmail', userController.updateUsername)
router.get('/setPass', userController.updateUserpass)
router.get('/content/detail', listController.getPostDetail)
router.get('/comments', commentsController.getComments)
router.get('/getinfo', userController.getinfo)
router.get('/getlabel', listController.getLabel)
router.get('/getLabels', publicController.getLabels)

export default router
