import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTripRatings1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE trip_ratings (
        id          SERIAL PRIMARY KEY,
        booking_id  INTEGER NOT NULL UNIQUE,
        customer_id INTEGER NOT NULL,
        driver_id   INTEGER NOT NULL,
        stars       SMALLINT NOT NULL CHECK (stars >= 1 AND stars <= 5),
        comment     VARCHAR,
        is_visible  BOOLEAN NOT NULL DEFAULT true,
        admin_note  VARCHAR,
        hidden_by   INTEGER,
        hidden_at   TIMESTAMP,
        created_at  TIMESTAMP NOT NULL DEFAULT now(),
        updated_at  TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_trip_ratings_booking_id  ON trip_ratings(booking_id);
      CREATE INDEX idx_trip_ratings_driver_id   ON trip_ratings(driver_id);
      CREATE INDEX idx_trip_ratings_customer_id ON trip_ratings(customer_id);
    `);

    // Add rating column to bookings if not already present
    await queryRunner.query(`
      ALTER TABLE bookings
        ADD COLUMN IF NOT EXISTS rating SMALLINT;
    `);

    // Add rating column to drivers if not already present
    await queryRunner.query(`
      ALTER TABLE drivers
        ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS trip_ratings;`);
  }
}
