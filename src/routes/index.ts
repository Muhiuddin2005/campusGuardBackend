import { Router } from 'express';
import AuthoritiesRoutes from '../modules/authorities/authorities.routes';
import FileUploadRoutes from '../modules/file_upload/fileUpload.routes';
import MessagesRoutes from '../modules/messages/messages.routes';
import ReportsRoutes from '../modules/reports/reports.routes';

const router = Router();

const moduleRoutes = [
  { path: '/reports', route: ReportsRoutes },
  { path: '/authorities', route: AuthoritiesRoutes },
  { path: '/messages', route: MessagesRoutes },
  { path: '/file-upload', route: FileUploadRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
