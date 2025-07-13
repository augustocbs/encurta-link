import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1752334350123 implements MigrationInterface {
  name = 'CreateUsersTable1752334350123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "urls" (
        "id" SERIAL PRIMARY KEY,
        "userId" integer,
        "originalUrl" text NOT NULL,
        "shortCode" varchar(6) NOT NULL,
        "clicks" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" TIMESTAMP(6),
        CONSTRAINT "UQ_shortCode" UNIQUE ("shortCode")
      )`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" (
        "id" SERIAL PRIMARY KEY,
        "email" varchar(255) NOT NULL,
        "password" varchar(255) NOT NULL,
        "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP(6),
        CONSTRAINT "UQ_email" UNIQUE ("email")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "urls" ADD CONSTRAINT "FK_user_url" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "urls" DROP CONSTRAINT "FK_user_url"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "urls"`);
  }
}
