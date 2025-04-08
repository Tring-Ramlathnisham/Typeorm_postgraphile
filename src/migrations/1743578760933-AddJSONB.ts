import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJSONB1743578760933 implements MigrationInterface {
    name = 'AddJSONB1743578760933'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "session" jsonb NOT NULL DEFAULT '{}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "session"`);
    }

}
