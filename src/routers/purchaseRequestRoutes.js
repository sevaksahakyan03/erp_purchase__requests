const express = require('express');
const router = express.Router();

const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware.js');

const { 
  createRequest, 
  getRequests, 
  submitRequest, 
  approveRequest, 
  rejectRequest 
} = require('../controllers/purchaseRequestController.js');

router.use(authenticateToken);

router.post('/', createRequest); 
router.get('/', getRequests); 

router.post('/:id/submit', submitRequest); 

router.post('/:id/approve', authorizeRoles('Manager', 'Admin'), approveRequest); 
router.post('/:id/reject', authorizeRoles('Manager', 'Admin'), rejectRequest); 

module.exports = router;