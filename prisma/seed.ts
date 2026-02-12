import { PrismaClient, AccountType, AccountStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@carplatform.pk';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const adminName = process.env.ADMIN_NAME || 'Platform Admin';

  console.log('🌱 Seeding database...');

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`✅ Admin user already exists: ${adminEmail}`);
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      fullName: adminName,
      accountType: AccountType.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      isVerified: true,
    },
  });

  console.log(`✅ Admin user created:`);
  console.log(`   Email:    ${admin.email}`);
  console.log(`   Name:     ${admin.fullName}`);
  console.log(`   Type:     ${admin.accountType}`);
  console.log(`   ID:       ${admin.id}`);
  console.log('');
  console.log('🔐 Default credentials:');
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log('   ⚠️  Change the password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
