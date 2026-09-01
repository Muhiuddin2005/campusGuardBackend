import { Router } from 'express';
import { authLimiter } from '../../middlewares/rateLimiter';
import { verifyAuthorityToken } from '../../middlewares/verifyAuthToken';
import AuthoritiesControllers from './authorities.controllers';

const router = Router();

// Public login
router.post('/login', authLimiter, AuthoritiesControllers.login);

// Authenticated current authority profile
router.get('/me', verifyAuthorityToken, AuthoritiesControllers.getMe);

export default router;
