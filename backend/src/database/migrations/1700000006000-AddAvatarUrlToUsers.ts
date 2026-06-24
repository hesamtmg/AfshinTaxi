import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAvatarUrlToUsers1700000006000 implements MigrationInterface {
  name = 'AddAvatarUrlToUsers1700000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatarUrl" VARCHAR`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "avatarUrl"`);
  }
}
