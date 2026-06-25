import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomerRewards1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enums
    await queryRunner.query(`
      CREATE TYPE rule_trigger_type_enum AS ENUM (
        'every_n_trips', 'trip_milestone', 'first_trip'
      );
    `);
    await queryRunner.query(`
      CREATE TYPE rule_reward_type_enum AS ENUM (
        'points', 'coupon', 'both'
      );
    `);
    await queryRunner.query(`
      CREATE TYPE customer_reward_status_enum AS ENUM (
        'pending_approval', 'approved', 'rejected'
      );
    `);
    await queryRunner.query(`
      CREATE TYPE customer_reward_type_enum AS ENUM (
        'points', 'coupon'
      );
    `);

    // reward_rules
    await queryRunner.query(`
      CREATE TABLE reward_rules (
        id                       SERIAL PRIMARY KEY,
        name                     VARCHAR NOT NULL,
        description              VARCHAR,
        is_active                BOOLEAN NOT NULL DEFAULT true,
        trigger_type             rule_trigger_type_enum NOT NULL,
        trigger_value            INTEGER,
        reward_type              rule_reward_type_enum NOT NULL,
        points_amount            INTEGER,
        coupon_discount_percent  DECIMAL(5,2),
        coupon_max_discount      INTEGER,
        coupon_validity_days     INTEGER NOT NULL DEFAULT 30,
        created_at               TIMESTAMP NOT NULL DEFAULT now(),
        updated_at               TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // customer_rewards
    await queryRunner.query(`
      CREATE TABLE customer_rewards (
        id                       SERIAL PRIMARY KEY,
        customer_id              INTEGER NOT NULL,
        booking_id               INTEGER NOT NULL,
        rule_id                  INTEGER,
        type                     customer_reward_type_enum NOT NULL,
        status                   customer_reward_status_enum NOT NULL DEFAULT 'pending_approval',
        points_amount            INTEGER,
        coupon_code              VARCHAR UNIQUE,
        coupon_discount_percent  DECIMAL(5,2),
        coupon_max_discount      INTEGER,
        coupon_expires_at        TIMESTAMP,
        coupon_used              BOOLEAN NOT NULL DEFAULT false,
        coupon_used_at           TIMESTAMP,
        reviewed_by              INTEGER,
        reviewed_at              TIMESTAMP,
        admin_note               VARCHAR,
        credited_at              TIMESTAMP,
        created_at               TIMESTAMP NOT NULL DEFAULT now(),
        updated_at               TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // customer_points (wallet)
    await queryRunner.query(`
      CREATE TABLE customer_points (
        id            SERIAL PRIMARY KEY,
        customer_id   INTEGER NOT NULL UNIQUE,
        balance       INTEGER NOT NULL DEFAULT 0,
        total_earned  INTEGER NOT NULL DEFAULT 0,
        total_spent   INTEGER NOT NULL DEFAULT 0,
        created_at    TIMESTAMP NOT NULL DEFAULT now(),
        updated_at    TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_customer_rewards_customer_id ON customer_rewards(customer_id);
      CREATE INDEX idx_customer_rewards_status ON customer_rewards(status);
      CREATE INDEX idx_customer_rewards_coupon_code ON customer_rewards(coupon_code);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS customer_rewards;`);
    await queryRunner.query(`DROP TABLE IF EXISTS customer_points;`);
    await queryRunner.query(`DROP TABLE IF EXISTS reward_rules;`);
    await queryRunner.query(`DROP TYPE IF EXISTS rule_trigger_type_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS rule_reward_type_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS customer_reward_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS customer_reward_type_enum;`);
  }
}
