import { makeExtendSchemaPlugin, gql } from "graphile-utils";

const CohostManagementPlugin = makeExtendSchemaPlugin((build: any) => {
  return {
    typeDefs: gql`
      extend type Mutation {
        manageCohost(
          userId:UUID!
          sessionId: UUID!
          cohostId: UUID!
          action: String!
        ): String
      }
    `,
    resolvers: {
      Mutation: {
        async manageCohost(_parent: any, { userId,sessionId, cohostId, action }: any, { pgClient }: any) {
          try {
            console.log("sessionId:", sessionId, "\ncohost:", cohostId, "\naction:", action,"\nuserId:",userId);

            const sessionQuery = `
              SELECT jsonb_path_query(session, '$.info[0].sessions ? (@.session_id == "${sessionId}")') AS session
              FROM users WHERE id='${userId}'
            `;
            const { rows: sessionRows } = await pgClient.query(sessionQuery);
            console.log("Session Rows:",sessionRows);

            if (sessionRows.length === 0 || !sessionRows[0].session) {
              return "Session not found";
            }

            const cohostQuery = `
              SELECT jsonb_path_query(
              session, 
              '$.info[0].sessions ? (@.session_id == "${sessionId}") .co_hosts ? (@.co_host_id == "${cohostId}")'
              ) AS cohost
              FROM users 
              WHERE id='${userId}' and jsonb_path_exists(
              session, 
              '$.info[0].sessions ? (@.session_id == "${sessionId}") .co_hosts ? (@.co_host_id == "${cohostId}")'
              );
            `;
            const { rows: cohostRows } = await pgClient.query(cohostQuery);
            console.log("Cohost Rows:",cohostRows);
            
            const cohostExists = cohostRows.length > 0;

            if (action === "add") {
              if (cohostExists) {
                return "Cohost already exists";
              }

              await pgClient.query(
                `
                UPDATE users 
                SET session = jsonb_set(
                  session, 
                  '{info,0,sessions}', 
                  (
                    SELECT jsonb_agg(
                      CASE 
                        WHEN session_item->>'session_id' = '${sessionId}' THEN 
                          jsonb_set(session_item, '{co_hosts}', 
                            (COALESCE(session_item->'co_hosts', '[]'::jsonb) || 
                            jsonb_build_object('co_host_id', '${cohostId}', 'is_remove', false, 'created_at', now(), 'updated_at', now()))
                          )
                        ELSE session_item
                      END
                    ) 
                    FROM jsonb_array_elements(session->'info'->0->'sessions') AS session_item
                  )
                )
                WHERE id='${userId}' and jsonb_path_exists(session, '$.info[0].sessions ? (@.session_id == "${sessionId}")')
                `
              );

              return "Cohost added successfully";
            } else if (action === "remove") {
              if (!cohostExists) {
                return "Cohost not found";
              }
              await pgClient.query(
                `UPDATE users 
                 SET session = jsonb_set(
                   session, 
                   '{info,0,sessions}', 
                   (
                     SELECT jsonb_agg(
                       CASE 
                         WHEN session_item->>'session_id' = '${sessionId}' THEN 
                           jsonb_set(session_item, '{co_hosts}', 
                             COALESCE(
                               (SELECT jsonb_agg(cohost)
                                FROM jsonb_array_elements(session_item->'co_hosts') AS cohost
                                WHERE cohost->>'co_host_id' != '${cohostId}'), 
                               '[]'::jsonb
                             )
                           )
                         ELSE session_item
                       END
                     ) 
                     FROM jsonb_array_elements(session->'info'->0->'sessions') AS session_item
                   )
                 )
                 WHERE id='${userId}' and jsonb_path_exists(session, '$.info[0].sessions ? (@.session_id == "${sessionId}")')
                `
              );
              

              return "Cohost removed successfully";
            } else {
              return "Invalid action. Use 'add' or 'remove'.";
            }
          } catch (error) {
            console.error("Error managing cohost:", error);
            return "An error occurred";
          }
        },
      },
    },
  };
});

export default CohostManagementPlugin;
