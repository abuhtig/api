import Router from 'koa-router'
import ContentController from '../api/ContentController'

const router = new Router()

router.prefix('/content')
router.post('/upload', ContentController.uploadImg)
router.post('/add', ContentController.addPost)
router.post('/uploadWang', ContentController.uploadWangImg)
router.post('/editpost', ContentController.editPost)
router.get('/deletepost', ContentController.deletepost)
router.post('/editpostbyid', ContentController.editPostbyId)
router.post('/addLabel', ContentController.addLabel)
router.post('/editLabel', ContentController.editLabel)
router.get('/deletelabel',ContentController.deleteLabel)

export default router