/**
 * BuildFlow - Tasks Routes
 */

const router = require('express').Router()
const tasksController = require('../controllers/tasks')
const { authMiddleware } = require('../middleware/auth')

router.use(authMiddleware)

// GET /api/tasks
router.get('/', tasksController.getAll)

// POST /api/tasks
router.post('/', tasksController.create)

// GET /api/tasks/:id
router.get('/:id', tasksController.getById)

// PUT /api/tasks/:id
router.put('/:id', tasksController.update)

// DELETE /api/tasks/:id
router.delete('/:id', tasksController.delete)

// PATCH /api/tasks/:id/stato
router.patch('/:id/stato', tasksController.updateStato)

// POST /api/tasks/:id/time
router.post('/:id/time', tasksController.addTimeEntry)

// GET /api/tasks/:id/time
router.get('/:id/time', tasksController.getTimeEntries)

module.exports = router
