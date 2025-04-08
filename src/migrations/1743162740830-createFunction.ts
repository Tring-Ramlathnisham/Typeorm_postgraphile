import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFunction1743162740830 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION display_users()
            RETURNS TABLE ( tit varchar, des TEXT) AS $$
            BEGIN
            RETURN QUERY SELECT  title, description FROM users;
            END;
            $$ LANGUAGE plpgsql;
            `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `
            DROP FUNCTION IF EXISTS display_users();
            `
        );
    }

}
