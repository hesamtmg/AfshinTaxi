import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1786831350814 implements MigrationInterface {
    name = 'InitialSchema1786831350814'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "settings" ("id" SERIAL NOT NULL, "key" character varying NOT NULL, "value" text NOT NULL, "description" character varying, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c8639b7626fa94ba8265628f214" UNIQUE ("key"), CONSTRAINT "PK_0669fe20e252eb692bf4d344975" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."drivers_status_enum" AS ENUM('active', 'inactive', 'suspended')`);
        await queryRunner.query(`CREATE TABLE "drivers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fullName" character varying NOT NULL, "phone" character varying NOT NULL, "email" character varying, "status" "public"."drivers_status_enum" NOT NULL DEFAULT 'active', "carModel" character varying NOT NULL, "carPlate" character varying NOT NULL, "carColor" character varying, "carYear" character varying, "licenseNumber" character varying, "avatarUrl" character varying, "otpCode" character varying, "otpExpiresAt" TIMESTAMP, "currentLat" numeric(10,7), "currentLng" numeric(10,7), "locationUpdatedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b97a5a68c766d2d1ec25e6a85b2" UNIQUE ("phone"), CONSTRAINT "PK_92ab3fb69e566d3eb0cae896047" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."bookings_status_enum" AS ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "bookings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "driverId" uuid, "pickupAddress" character varying NOT NULL, "pickupLat" numeric(10,7) NOT NULL, "pickupLng" numeric(10,7) NOT NULL, "dropoffAddress" character varying NOT NULL, "dropoffLat" numeric(10,7) NOT NULL, "dropoffLng" numeric(10,7) NOT NULL, "distanceKm" numeric(10,2), "estimatedFare" numeric(10,2), "finalFare" numeric(10,2), "status" "public"."bookings_status_enum" NOT NULL DEFAULT 'pending', "scheduledAt" TIMESTAMP NOT NULL, "passengerCount" integer, "notes" character varying, "cancellationReason" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('client', 'admin')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phone" character varying NOT NULL, "email" character varying, "fullName" character varying NOT NULL, "password" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'client', "isVerified" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "avatarUrl" character varying, "otpCode" character varying, "otpExpiresAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."driver_rewards_type_enum" AS ENUM('trip_milestone', 'high_rating', 'monthly_top', 'custom')`);
        await queryRunner.query(`CREATE TYPE "public"."driver_rewards_status_enum" AS ENUM('pending_approval', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "driver_rewards" ("id" SERIAL NOT NULL, "driver_id" integer NOT NULL, "type" "public"."driver_rewards_type_enum" NOT NULL, "title" character varying NOT NULL, "description" character varying, "icon" character varying, "status" "public"."driver_rewards_status_enum" NOT NULL DEFAULT 'pending_approval', "awarded_at" TIMESTAMP, "reviewed_by" integer, "reviewed_at" TIMESTAMP, "admin_note" character varying, "milestone_value" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3fb0b2feeb9cdaca864b3a420f6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "trip_ratings" ("id" SERIAL NOT NULL, "booking_id" uuid NOT NULL, "user_id" uuid NOT NULL, "driver_id" uuid NOT NULL, "stars" smallint NOT NULL, "comment" character varying, "is_visible" boolean NOT NULL DEFAULT true, "admin_note" character varying, "hidden_by" character varying, "hidden_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_33960be276db641f322518f91b4" UNIQUE ("booking_id"), CONSTRAINT "REL_33960be276db641f322518f91b" UNIQUE ("booking_id"), CONSTRAINT "PK_f1cbae22ce575b3e73e29d1082a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."reward_rules_trigger_type_enum" AS ENUM('every_n_trips', 'trip_milestone', 'first_trip')`);
        await queryRunner.query(`CREATE TYPE "public"."reward_rules_reward_type_enum" AS ENUM('points', 'coupon', 'both')`);
        await queryRunner.query(`CREATE TABLE "reward_rules" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, "is_active" boolean NOT NULL DEFAULT true, "trigger_type" "public"."reward_rules_trigger_type_enum" NOT NULL, "trigger_value" integer, "reward_type" "public"."reward_rules_reward_type_enum" NOT NULL, "points_amount" integer, "coupon_discount_percent" numeric(5,2), "coupon_max_discount" integer, "coupon_validity_days" integer NOT NULL DEFAULT '30', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7e75373e3325158b8745f3dde45" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."customer_rewards_type_enum" AS ENUM('points', 'coupon')`);
        await queryRunner.query(`CREATE TYPE "public"."customer_rewards_status_enum" AS ENUM('pending_approval', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "customer_rewards" ("id" SERIAL NOT NULL, "customer_id" integer NOT NULL, "booking_id" integer NOT NULL, "rule_id" integer, "type" "public"."customer_rewards_type_enum" NOT NULL, "status" "public"."customer_rewards_status_enum" NOT NULL DEFAULT 'pending_approval', "points_amount" integer, "coupon_code" character varying, "coupon_discount_percent" numeric(5,2), "coupon_max_discount" integer, "coupon_expires_at" TIMESTAMP, "coupon_used" boolean NOT NULL DEFAULT false, "coupon_used_at" TIMESTAMP, "reviewed_by" integer, "reviewed_at" TIMESTAMP, "admin_note" character varying, "credited_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_44d86f757ce7dbd5411f2046d6e" UNIQUE ("coupon_code"), CONSTRAINT "PK_31291dd1f73fc4473dd82a15968" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "customer_points" ("id" SERIAL NOT NULL, "customer_id" integer NOT NULL, "balance" integer NOT NULL DEFAULT '0', "total_earned" integer NOT NULL DEFAULT '0', "total_spent" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0ebb6a8e7d5822e0fde6f2da5b3" UNIQUE ("customer_id"), CONSTRAINT "PK_4dba2e9fd22680d5ac524c1d6ce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_38a69a58a323647f2e75eb994de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_100b344bc1e04cc839fe90c3d53" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trip_ratings" ADD CONSTRAINT "FK_33960be276db641f322518f91b4" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trip_ratings" ADD CONSTRAINT "FK_993278eb1381fdf3d813c58872d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trip_ratings" ADD CONSTRAINT "FK_09a10740a1d6a88270d3a113657" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trip_ratings" DROP CONSTRAINT "FK_09a10740a1d6a88270d3a113657"`);
        await queryRunner.query(`ALTER TABLE "trip_ratings" DROP CONSTRAINT "FK_993278eb1381fdf3d813c58872d"`);
        await queryRunner.query(`ALTER TABLE "trip_ratings" DROP CONSTRAINT "FK_33960be276db641f322518f91b4"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_100b344bc1e04cc839fe90c3d53"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_38a69a58a323647f2e75eb994de"`);
        await queryRunner.query(`DROP TABLE "customer_points"`);
        await queryRunner.query(`DROP TABLE "customer_rewards"`);
        await queryRunner.query(`DROP TYPE "public"."customer_rewards_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."customer_rewards_type_enum"`);
        await queryRunner.query(`DROP TABLE "reward_rules"`);
        await queryRunner.query(`DROP TYPE "public"."reward_rules_reward_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."reward_rules_trigger_type_enum"`);
        await queryRunner.query(`DROP TABLE "trip_ratings"`);
        await queryRunner.query(`DROP TABLE "driver_rewards"`);
        await queryRunner.query(`DROP TYPE "public"."driver_rewards_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."driver_rewards_type_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "bookings"`);
        await queryRunner.query(`DROP TYPE "public"."bookings_status_enum"`);
        await queryRunner.query(`DROP TABLE "drivers"`);
        await queryRunner.query(`DROP TYPE "public"."drivers_status_enum"`);
        await queryRunner.query(`DROP TABLE "settings"`);
    }

}
