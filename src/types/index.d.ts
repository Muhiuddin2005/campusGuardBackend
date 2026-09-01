import { AuthorityRole } from '@prisma/client';

export type TJWTPayload = {
  id: string;
  email: string;
  name: string;
  role: AuthorityRole;
};

declare global {
  namespace Express {
    interface Request {
      user?: TJWTPayload;
    }
  }
}
