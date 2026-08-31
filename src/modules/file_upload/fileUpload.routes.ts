import { Router } from 'express';
import { uploadLimiter } from '../../middlewares/rateLimiter';
import FileUploadControllers from './fileUpload.controllers';
import { upload } from './fileUpload.helpers';

const router = Router();

// Anonymous media evidence upload route (Single file: "file")
router.post(
  '/',
  uploadLimiter,
  upload.single('file'),
  FileUploadControllers.uploadFile
);

export default router;
