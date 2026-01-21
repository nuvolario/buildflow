/**
 * BuildFlow - Route Aggregator
 */

const router = require('express').Router()

// Import routes
const authRoutes = require('./auth')
const cantieriRoutes = require('./cantieri')
const squadreRoutes = require('./squadre')
const membriRoutes = require('./membri')
const tasksRoutes = require('./tasks')

// Mount routes
router.use('/auth', authRoutes)
router.use('/cantieri', cantieriRoutes)
router.use('/squadre', squadreRoutes)
router.use('/membri', membriRoutes)
router.use('/tasks', tasksRoutes)

module.exports = router
