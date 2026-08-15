import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import AppDataSource from '../data-source';
import { User, UserRole } from '../entities/user.entity';

async function seed() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log('ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping admin seed.');
    return;
  }

  const dataSource = await AppDataSource.initialize();
  const userRepo = dataSource.getRepository(User);

  try {
    let admin = await userRepo.findOne({ where: { email: adminEmail } });

    if (admin) {
      console.log(`Admin user "${adminEmail}" already exists, skipping.`);
      return;
    }

    admin = userRepo.create({
      email: adminEmail,
      phone: process.env.ADMIN_PHONE || '+989000000000',
      fullName: 'Admin',
      password: await bcrypt.hash(adminPassword, 10),
      role: UserRole.ADMIN,
      isVerified: true,
      isActive: true,
    });

    await userRepo.save(admin);
    console.log(`Admin user "${adminEmail}" created.`);
  } finally {
    await dataSource.destroy();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
