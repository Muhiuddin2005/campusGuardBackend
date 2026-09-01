import bcrypt from 'bcryptjs';
import prisma from '../src/libs/prisma';

async function seedAuthority() {
  const email = process.env.SEED_AUTHORITY_EMAIL || 'authority@ruet.ac.bd';
  const rawPassword = process.env.SEED_AUTHORITY_PASSWORD || 'DisciplineBoard2026!';
  const name = process.env.SEED_AUTHORITY_NAME || 'Disciplinary Board RUET';
  const role = 'ADMIN';

  console.log('🌱 Seeding initial authority user...');

  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const authority = await prisma.authorities.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      name,
      role,
      isActive: true,
    },
    create: {
      email,
      password: hashedPassword,
      name,
      role,
      isActive: true,
    },
  });

  console.log('✅ Authority created/updated successfully:');
  console.log({
    id: authority.id,
    email: authority.email,
    name: authority.name,
    role: authority.role,
    password: '(bcrypt hashed in DB)',
  });
  console.log(`🔑 Credentials to log in: Email="${email}" | Password="${rawPassword}"`);
}

seedAuthority()
  .catch((e) => {
    console.error('❌ Failed to seed authority:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
