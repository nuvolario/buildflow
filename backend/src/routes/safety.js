/**
 * BuildFlow - Safety Routes
 * API per gestione sicurezza sul lavoro
 */

const router = require('express').Router()
const safetyController = require('../controllers/safety')
const { authMiddleware } = require('../middleware/auth')

router.use(authMiddleware)

// ============================================================
// CATEGORIE E DPI
// ============================================================

// GET /api/safety/categories - Lista categorie attivita con livelli rischio
router.get('/categories', safetyController.getCategories)

// GET /api/safety/dpi - Lista DPI disponibili
router.get('/dpi', safetyController.getDpi)

// ============================================================
// TEMPLATE CHECKLIST
// ============================================================

// GET /api/safety/templates - Lista template checklist
router.get('/templates', safetyController.getTemplates)

// GET /api/safety/templates/:id - Dettaglio template con items
router.get('/templates/:id', safetyController.getTemplateById)

// ============================================================
// CHECKLIST COMPILATE
// ============================================================

// POST /api/safety/checklists - Avvia nuova checklist
router.post('/checklists', safetyController.createChecklist)

// GET /api/safety/checklists/:id - Dettaglio checklist
router.get('/checklists/:id', safetyController.getChecklistById)

// PATCH /api/safety/checklists/:id/responses/:responseId - Aggiorna risposta
router.patch('/checklists/:id/responses/:responseId', safetyController.updateResponse)

// POST /api/safety/checklists/:id/complete - Completa e firma checklist
router.post('/checklists/:id/complete', safetyController.completeChecklist)

// ============================================================
// INCIDENTI E NEAR-MISS
// ============================================================

// GET /api/safety/incidents - Lista incidenti
router.get('/incidents', safetyController.getIncidents)

// POST /api/safety/incidents - Segnala incidente
router.post('/incidents', safetyController.createIncident)

module.exports = router
