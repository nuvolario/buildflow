/**
 * BuildFlow - Documents Routes
 */

const router = require('express').Router()
const documentsController = require('../controllers/documents')
const { authMiddleware } = require('../middleware/auth')

router.use(authMiddleware)

// GET /api/documents/types - Lista tipi documento
router.get('/types', documentsController.getDocumentTypes)

// GET /api/documents/expiring - Documenti in scadenza
router.get('/expiring', documentsController.getExpiringDocuments)

// GET /api/documents/compliance/:membroId - Verifica compliance membro
router.get('/compliance/:membroId', documentsController.checkMemberCompliance)

// GET /api/documents - Lista documenti
router.get('/', documentsController.getDocuments)

// POST /api/documents - Carica documento
router.post('/', documentsController.createDocument)

// PATCH /api/documents/:id/verify - Approva/rifiuta documento
router.patch('/:id/verify', documentsController.verifyDocument)

module.exports = router
