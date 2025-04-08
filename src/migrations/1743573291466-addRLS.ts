import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRLS1743573291466 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE users ENABLE ROW LEVEL SECURITY;`);

        await queryRunner.query(`CREATE ROLE "user" WITH LOGIN;`);
        await queryRunner.query(`CREATE ROLE "admin" WITH LOGIN;`);

        /** TABLE LEVEL SECURITY */
        await queryRunner.query(`GRANT ALL ON users to "user";`);
        await queryRunner.query(`GRANT ALL ON users to "admin";`);

        await queryRunner.query(`CREATE POLICY admin_policy ON users FOR ALL TO "admin" USING (current_setting('myapp.role') = 'admin') WITH CHECK (current_setting('myapp.role') = 'admin');`);
        await queryRunner.query(`
            CREATE POLICY user_select_policy ON users 
            FOR SELECT TO "user"
            USING (id = current_setting('myapp.user_id')::UUID);
        `);

        await queryRunner.query(`
            CREATE POLICY user_insert_policy ON users 
            FOR INSERT TO "user"
            WITH CHECK (id = current_setting('myapp.user_id')::UUID);
        `);

        await queryRunner.query(`
            CREATE POLICY user_update_policy ON users 
            FOR UPDATE TO "user"
            USING (id = current_setting('myapp.user_id')::UUID);
        `);

        await queryRunner.query(`
            CREATE POLICY user_delete_policy ON users 
            FOR DELETE TO "user"
            USING (id = current_setting('myapp.user_id')::UUID);
        `);
                                  
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM "user";
            DROP ROLE "user";`);
        await queryRunner.query(`
            REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM "user";
            DROP ROLE "user";`);
        await queryRunner.query(`DROP POLICY IF EXISTS user_select_policy ON users;`);
        await queryRunner.query(`DROP POLICY IF EXISTS user_insert_policy ON users;`);
        await queryRunner.query(`DROP POLICY IF EXISTS user_update_policy ON users;`);
        await queryRunner.query(`DROP POLICY IF EXISTS user_delete_policy ON users;`);
        
        await queryRunner.query(`
            DROP POLICY IF EXISTS admin_policy ON users;
            ALTER TABLE users DISABLE ROW LEVEL SECURITY;
        `);
    }

}
