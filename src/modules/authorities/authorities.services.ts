import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import configs from '../../configs/configs';
import AppError from '../../errors/AppError';
import prisma from '../../libs/prisma';
import {
  TAuthorityLoginPayload,
  TAuthorityLoginResponse,
  TAuthorityProfile,
} from './authorities.types';

const login = async (payload: TAuthorityLoginPayload): Promise<TAuthorityLoginResponse> => {
  const { email, password } = payload;

  if (!email || !password) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Email and password are required');
  }

  const cleanEmail = email.trim().toLowerCase();

  const authority = await prisma.authorities.findUnique({
    where: { email: cleanEmail },
  });

  // Uniform error response to prevent user enumeration
  if (!authority || !authority.isActive) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, authority.password);
  if (!isPasswordValid) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid email or password');
  }

  const jwtPayload = {
    id: authority.id,
    email: authority.email,
    name: authority.name,
    role: authority.role,
  };

  const token = jwt.sign(jwtPayload, configs.jwtSecret, {
    expiresIn: (configs.jwtExpiresIn || '7d') as any,
  });

  return {
    token,
    user: jwtPayload,
  };
};

const getMe = async (authorityId: string): Promise<TAuthorityProfile> => {
  if (!authorityId) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized: Authority ID is missing');
  }

  const authority = await prisma.authorities.findUnique({
    where: { id: authorityId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  if (!authority) {
    throw new AppError(httpStatus.NOT_FOUND, 'Authority account not found');
  }

  return authority;
};

const AuthoritiesServices = {
  login,
  getMe,
};

export default AuthoritiesServices;
