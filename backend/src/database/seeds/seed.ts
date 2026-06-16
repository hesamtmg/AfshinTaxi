import { AppDataSource } from '../data-source';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

async function seed() {
  console.log('🌱 Starting seed...');
  await AppDataSource.initialize();

  const userRepo    = AppDataSource.getRepository('users');
  const settingRepo = AppDataSource.getRepository('settings');

  // ── 1. Admin user ─────────────────────────────────────────────────────────
  const adminEmail    = process.env.ADMIN_EMAIL    || 'admin@afshintaxi.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const existing      = await userRepo.findOne({ where: { email: adminEmail } });

  if (!existing) {
    const hashed = await bcrypt.hash(adminPassword, 10);
    await userRepo.save(userRepo.create({
      fullName: 'Admin', phone: '+00000000000',
      email: adminEmail, password: hashed,
      role: 'admin', isVerified: true, isActive: true,
    }));
    console.log(`✅ Admin user created: ${adminEmail}`);
  } else {
    console.log(`⏭️  Admin user already exists: ${adminEmail}`);
  }

  // ── 2. Default settings ───────────────────────────────────────────────────
  const defaults = [
    { key: 'fare_per_km',                   value: '1.5',   description: 'Fare charged per kilometer ($)' },
    { key: 'base_fare',                      value: '0',     description: 'Flat base fare per booking ($)' },
    { key: 'minimum_fare',                   value: '3',     description: 'Minimum fare per booking ($)' },
    { key: 'min_advance_minutes',            value: '30',    description: 'Minimum booking advance time (minutes)' },
    { key: 'max_passengers',                 value: '8',     description: 'Maximum passengers per booking' },
    { key: 'sms_on_booking',                 value: 'true',  description: 'Send SMS on new booking' },
    { key: 'sms_on_driver_assigned',         value: 'true',  description: 'Send SMS when driver assigned' },
    // Feature 2: Cancellation policy
    { key: 'cancellation_deadline_minutes',  value: '60',    description: 'Minutes before trip when cancellation is blocked (0 = always allowed)' },
    // Feature 3: Driver availability buffer
    { key: 'driver_buffer_minutes',          value: '60',    description: 'Buffer window in minutes to check driver availability around a trip' },
  ];

  for (const setting of defaults) {
    const exists = await settingRepo.findOne({ where: { key: setting.key } });
    if (!exists) {
      await settingRepo.save(settingRepo.create(setting));
      console.log(`✅ Setting: ${setting.key} = ${setting.value}`);
    } else {
      console.log(`⏭️  Setting exists: ${setting.key}`);
    }
  }

  // ── 3. Sample driver (dev only) ───────────────────────────────────────────
  if (process.env.NODE_ENV === 'development') {
    const driverRepo  = AppDataSource.getRepository('drivers');
    const driverCount = await driverRepo.count();
    if (driverCount === 0) {
      await driverRepo.save(driverRepo.create({
        fullName: 'Ali Rezaei', phone: '+989121234567',
        email: 'ali@example.com', status: 'active',
        carModel: 'Toyota Camry', carPlate: 'IRN-12345',
        carColor: 'White', carYear: '2020', licenseNumber: 'DL-98765',
      }));
      console.log('✅ Sample driver created');
    }
  }

  await AppDataSource.destroy();
  console.log('\n🎉 Seed completed!');
}

seed().catch((err) => { console.error('❌ Seed failed:', err); process.exit(1); });
