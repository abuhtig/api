import Router from 'koa-router'
import ContentController from '../api/ContentController'

const router = new Router()

router.prefix('/content')
// upload 上传用户头像
router.post('/upload', ContentController.uploadImg)
router.post('/add', ContentController.addPost)
// uploadWang 上传编辑器的图片
router.post('/uploadWang', ContentController.uploadWangImg)
// router.post('/editpost', ContentController.editPost)
router.get('/deletepost', ContentController.deletepost)
router.post('/deleteposts', ContentController.deleteposts)
router.post('/editpostbyid', ContentController.editPost)
router.post('/batchposts', ContentController.batchUpdatePosts)
router.post('/addLabel', ContentController.addLabel)
router.post('/editLabel', ContentController.editLabel)
router.get('/deletelabel',ContentController.deleteLabel)
router.get('/getHistory',ContentController.getHistory)
router.get('/deleteHistory',ContentController.deleteHistory)

export default router