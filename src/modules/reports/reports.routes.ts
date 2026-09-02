import { Router } from 'express';
import { createReportLimiter, passcodeLimiter } from '../../middlewares/rateLimiter';
import { verifyAuthorityToken } from '../../middlewares/verifyAuthToken';
import ReportsControllers from './reports.controllers';

const router = Router();

// Anonymous reporter endpoints
router.post('/create', createReportLimiter, ReportsControllers.createReport);
router.post('/track', passcodeLimiter, ReportsControllers.trackReport);

// Authority endpoints (Protected by JWT)
router.get('/all', verifyAuthorityToken, ReportsControllers.getAllReports);
router.get('/:id', verifyAuthorityToken, ReportsControllers.getReportById);
router.patch('/:id', verifyAuthorityToken, ReportsControllers.updateReportStatus);

export default router;
