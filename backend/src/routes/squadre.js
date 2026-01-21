/**
 * BuildFlow - Squadre Routes
 */

const router = require('express').Router()
const squadreController = require('../controllers/squadre')
const { authMiddleware } = require('../middleware/auth')

router.use(authMiddleware)

// GET /api/squadre
router.get('/', squadreController.getAll)

// POST /api/squadre
router.post('/', squadreController.create)

// GET /api/squadre/:id
router.get('/:id', squadreController.getById)

// PUT /api/squadre/:id
router.put('/:id', squadreController.update)

// DELETE /api/squadre/:id
router.delete('/:id', squadreController.delete)

// GET /api/squadre/:id/membri
router.get('/:id/membri', squadreController.getMembri)

// POST /api/squadre/:id/membri
router.post('/:id/membri', squadreController.addMembro)

// DELETE /api/squadre/:id/membri/:membroId
router.delete('/:id/membri/:membroId', squadreController.removeMembro)

module.exports = router
