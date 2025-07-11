import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTables1752197185013 implements MigrationInterface {
    name = 'CreateTables1752197185013'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`urls\` (\`id\` int NOT NULL AUTO_INCREMENT, \`userId\` int NULL, \`originalUrl\` varchar(767) NOT NULL, \`shortCode\` varchar(6) NOT NULL, \`clicks\` int NOT NULL DEFAULT '0', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, UNIQUE INDEX \`IDX_aacdba4c65e535a14ccf5db306\` (\`originalUrl\`), UNIQUE INDEX \`IDX_34ced802e4a45bf6a6346f2eb9\` (\`shortCode\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`urls\` ADD CONSTRAINT \`FK_3088b58113241e3f5f6c10cf1fb\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`urls\` DROP FOREIGN KEY \`FK_3088b58113241e3f5f6c10cf1fb\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_34ced802e4a45bf6a6346f2eb9\` ON \`urls\``);
        await queryRunner.query(`DROP INDEX \`IDX_aacdba4c65e535a14ccf5db306\` ON \`urls\``);
        await queryRunner.query(`DROP TABLE \`urls\``);
    }

}
