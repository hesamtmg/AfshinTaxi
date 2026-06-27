import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDriverLocation1700000007000 implements MigrationInterface {
  name = 'AddDriverLocation1700000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "drivers" ADD COLUMN IF NOT EXISTS "currentLat" DECIMAL(10,7)`);
    await queryRunner.query(`ALTER TABLE "drivers" ADD COLUMN IF NOT EXISTS "currentLng" DECIMAL(10,7)`);
    await queryRunner.query(`ALTER TABLE "drivers" ADD COLUMN IF NOT EXISTS "locationUpdatedAt" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "drivers" DROP COLUMN IF EXISTS "locationUpdatedAt"`);
    await queryRunner.query(`ALTER TABLE "drivers" DROP COLUMN IF EXISTS "currentLng"`);
    await queryRunner.query(`ALTER TABLE "drivers" DROP COLUMN IF EXISTS "currentLat"`);
  }
}
