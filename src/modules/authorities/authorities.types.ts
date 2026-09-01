import { AuthorityRole } from '@prisma/client';

export type TAuthorityLoginPayload = {
  email: string;
  password: string;
};

export type TAuthorityLoginResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: AuthorityRole;
  };
};

export type TAuthorityProfile = {
  id: string;
  email: string;
  name: string;
  role: AuthorityRole;
  createdAt: Date;
};
