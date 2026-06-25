import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDriverRewards1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE reward_type_enum AS ENUM (
        'trip_milestone',
        'high_rating',
        'monthly_top',
        'custom'
      );
    `);

    await queryRunner.query(`
      CREATE TYPE reward_status_enum AS ENUM (
        'pending_approval',
        'approved',
        'rejected'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE driver_rewards (
        id               SERIAL PRIMARY KEY,
        driver_id        INTEGER NOT NULL,
        type             reward_type_enum NOT NULL,
        title            VARCHAR NOT NULL,
        description      VARCHAR,
        icon             VARCHAR,
        status           reward_status_enum NOT NULL DEFAULT 'pending_approval',
        awarded_at       TIMESTAMP,
        reviewed_by      INTEGER,
        reviewed_at      TIMESTAMP,
        admin_note       VARCHAR,
        milestone_value  INTEGER,
        created_at       TIMESTAMP NOT NULL DEFAULT now(),
        updated_at       TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_driver_rewards_driver_id ON driver_rewards(driver_id);
      CREATE INDEX idx_driver_rewards_status ON driver_rewards(status);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS driver_rewards;`);
    await queryRunner.query(`DROP TYPE IF EXISTS reward_type_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS reward_status_enum;`);
  }
}
