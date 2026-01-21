/**
 * BuildFlow - Cantieri Routes
 */

const router = require('express').Router()
const cantieriController = require('../controllers/cantieri')
const { authMiddleware } = require('../middleware/auth')

// Tutte le route richiedono autenticazione
router.use(authMiddleware)

// GET /api/cantieri
router.get('/', cantieriController.getAll)

// POST /api/cantieri
router.post('/', cantieriController.create)

// GET /api/cantieri/:id
router.get('/:id', cantieriController.getById)

// PUT /api/cantieri/:id
router.put('/:id', cantieriController.update)

// DELETE /api/cantieri/:id
router.delete('/:id', cantieriController.delete)

// GET /api/cantieri/:id/milestones
router.get('/:id/milestones', cantieriController.getMilestones)

// POST /api/cantieri/:id/milestones
router.post('/:id/milestones', cantieriController.createMilestone)

// GET /api/cantieri/:id/team
router.get('/:id/team', cantieriController.getTeam)

// POST /api/cantieri/:id/team
router.post('/:id/team', cantieriController.assignTeam)

module.exports = router
