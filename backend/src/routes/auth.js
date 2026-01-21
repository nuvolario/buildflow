/**
 * BuildFlow - Auth Routes
 */

const router = require('express').Router()
const authController = require('../controllers/auth')
const { authMiddleware } = require('../middleware/auth')

// POST /api/auth/register
router.post('/register', authController.register)

// POST /api/auth/login
router.post('/login', authController.login)

// GET /api/auth/me
router.get('/me', authMiddleware, authController.me)

// POST /api/auth/logout
router.post('/logout', authMiddleware, authController.logout)

module.exports = router
