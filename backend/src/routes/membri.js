/**
 * BuildFlow - Membri Routes
 */

const router = require('express').Router()
const membriController = require('../controllers/membri')
const { authMiddleware } = require('../middleware/auth')

router.use(authMiddleware)

// GET /api/membri
router.get('/', membriController.getAll)

// POST /api/membri
router.post('/', membriController.create)

// GET /api/membri/:id
router.get('/:id', membriController.getById)

// PUT /api/membri/:id
router.put('/:id', membriController.update)

// DELETE /api/membri/:id
router.delete('/:id', membriController.delete)

// GET /api/membri/:id/disponibilita
router.get('/:id/disponibilita', membriController.getDisponibilita)

// POST /api/membri/:id/disponibilita
router.post('/:id/disponibilita', membriController.setDisponibilita)

module.exports = router
