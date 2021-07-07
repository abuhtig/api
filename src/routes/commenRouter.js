import Router from 'koa-router'
import CommentsController from '../api/CommentsController'

const router = new Router()

router.prefix('/comments')
router.post('/reply', CommentsController.addComment)
router.get('/accept', CommentsController.setBest)
router.get('/sethands', CommentsController.setHands)

export default router