import Router from 'koa-router'
import userController from '../api/UserController'
import contentController from '../api/ContentController';

const router = new Router()

router.prefix('/user')
router.get('/fav', userController.userSign)
router.post('/basic', userController.updateUserInfo)
router.post('/changepw', userController.changepw)
router.get('/Collect', userController.collect)
router.get('/setCollect', userController.setCollect)
router.get('/post', contentController.getPostListByUid)
router.get('/deletePost', contentController.deletePostByTid)
router.get('/getColleList', contentController.getColleByUid)
router.get('/getmsg', userController.getmsg)

export default router