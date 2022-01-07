import Router from 'koa-router'
import AdminController from '../api/AdminController'

const router = new Router()

router.prefix('/admin')
router.post('/addMenu', AdminController.addMenu)
router.get('/deleteMenu', AdminController.deleteMenu)
router.post('/updataMenu', AdminController.updataMenu)
router.get('/getMenus', AdminController.getMenus)
router.post('/addRoles', AdminController.addRoles)
router.get('/deleteRoles', AdminController.deleteRoles)
router.post('/updataRoles', AdminController.updataRoles)
router.get('/getRoles', AdminController.getRoles)
router.get('/getRolesName', AdminController.getRolesName)
router.post('/getcomment', AdminController.getcomment)
router.get('/deleteComment', AdminController.deleteComment)
router.post('/editComment', AdminController.editComment)
router.post('/batchEditComment', AdminController.batchEditComment)
router.post('/batchDeleteComment', AdminController.batchDeleteComment)
router.get('/getroutes', AdminController.getRoutes)
router.get('/getStats', AdminController.getStats)
router.get('/getLogs', AdminController.getLogs)
router.get('/deleteLogs', AdminController.deleteLogs)
// router.get('/getOperations', AdminController.getOperations)
export default router