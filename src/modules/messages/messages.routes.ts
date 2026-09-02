import { Router } from 'express';
import { passcodeLimiter } from '../../middlewares/rateLimiter';
import { verifyAuthorityToken } from '../../middlewares/verifyAuthToken';
import MessagesControllers from './messages.controllers';

const router = Router();

// Anonymous reporter chat endpoints (Passcode sent in POST body)
router.post('/thread', passcodeLimiter, MessagesControllers.getReporterThread);
router.post('/send', passcodeLimiter, MessagesControllers.sendReporterMessage);

// Disciplinary board / Authority chat endpoints (Protected by JWT)
router.get('/:reportId', verifyAuthorityToken, MessagesControllers.getAuthorityThread);
router.post('/:reportId', verifyAuthorityToken, MessagesControllers.sendAuthorityMessage);

export default router;
