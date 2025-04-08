import "reflect-metadata"
import express from "express";
import { AppDataSource } from "./data-source";
import dotenv from "dotenv";
import postgraphile from "postgraphile";
import cohostPlugin from "./plugins/cohostPlugin";
import SubscriptionsLdsPlugin from "@graphile/subscriptions-lds";
import cohostManagementPlugin from "./plugins/cohostManagementPlugin";


dotenv.config();

const app=express();


const DATABASE_URL=`postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`

const main=async()=>{
    try{
        await AppDataSource.initialize().
        then(()=>{
            console.log("PostgresQL Connected"); 

            app.use(
                postgraphile(DATABASE_URL,"public",{
                    watchPg:true,
                    graphiql:true,
                    enhanceGraphiql:true,
                    dynamicJson:true,
                    enableCors:true,
                    appendPlugins:[cohostPlugin,SubscriptionsLdsPlugin],
                    exportGqlSchemaPath:"./schema.graphql",
                    subscriptions:true,
                    live:true,
                    ownerConnectionString:DATABASE_URL,
                    pgSettings:async(req) =>{
                        const userId=req.headers['user_id'] as string;
                        const role=req.headers['role'] as string;
                        if(userId && role){
                            console.log("USER ID:",userId);
                            console.log("ROLE:",role);
                            return {
                                'role':role,
                                'myapp.user_id':userId,
                                'myapp.role':role,
                            };
                        }
                        
                        return {};
                    },
                    // allowExplain: (req) => { return true; },
                })
            );
            const PORT=process.env.PORT || 5000;
            app.listen(PORT,()=>{
                console.log(`GraphQl API is running on http://localhost:${PORT}/graphiql`);

            });
        })
        await AppDataSource.synchronize();
        console.log("Database Synchronized");
    }
    catch(error){
        console.error("Database Connection Error:",error); 
        process.exit(1); 
    }
};
main();
