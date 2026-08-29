import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const configs = {
  port: process.env.PORT || 8000,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbUri: process.env.DATABASE_URL as string,
  passcodePepper: process.env.PASSCODE_PEPPER || 'campusguard_default_pepper_key_change_in_prod',
  jwtSecret: process.env.JWT_SECRET || 'campusguard_default_jwt_secret_change_in_prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    bucket: process.env.SUPABASE_BUCKET || 'campusguard-media',
  },
};

export default configs;
