import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDriverOtpFields1700000005000 implements MigrationInterface {
  name = 'AddDriverOtpFields1700000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "drivers" ADD COLUMN IF NOT EXISTS "otpCode" VARCHAR`);
    await queryRunner.query(`ALTER TABLE "drivers" ADD COLUMN IF NOT EXISTS "otpExpiresAt" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "drivers" DROP COLUMN IF EXISTS "otpExpiresAt"`);
    await queryRunner.query(`ALTER TABLE "drivers" DROP COLUMN IF EXISTS "otpCode"`);
  }
}
