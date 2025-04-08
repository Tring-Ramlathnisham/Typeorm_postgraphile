import { DataSource } from "typeorm";
import dotenv from"dotenv";

dotenv.config()

export const AppDataSource=new DataSource({
    type:"postgres",
    host:process.env.DB_HOST,
    port:5433,
    username:process.env.DB_USER,
    password:String(process.env.DB_PASSWORD),
    database:process.env.DB_NAME,
    entities:["src/entities/*.ts"],
    migrations:["src/migrations/*.ts"],
});