const express = require('express');
const router = express.Router();

const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const { 
  createRequest, 
  getRequests, 
  updateDraft, 
  submitRequest, 
  approveRequest, 
  rejectRequest 
} = require('../controllers/purchaseRequestController');

router.use(authenticateToken);

router.post('/', createRequest); 
router.get('/', getRequests); 

router.patch('/:id', updateDraft); 
router.post('/:id/submit', submitRequest); 

router.post('/:id/approve', authorizeRoles('Manager', 'Admin'), approveRequest); 
router.post('/:id/reject', authorizeRoles('Manager', 'Admin'), rejectRequest); 

module.exports = router;