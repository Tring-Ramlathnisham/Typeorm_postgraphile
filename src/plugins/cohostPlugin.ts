import { makeExtendSchemaPlugin, gql } from "graphile-utils";

const COHOST_EVENT = "postgraphile:public.users";

const cohostPlugin = makeExtendSchemaPlugin(build => {
  return {
    typeDefs: gql`
      type Cohost {
        message: String!
        userId: UUID!
        sessionId: UUID!
        cohostId: UUID!
        action: String!
      }
      type DataSubscription{
        operation:String
        old:User
        new:User
      }

      extend type Mutation {
        manageCohost(
          userId: UUID!
          sessionId: UUID!
          cohostId: UUID!
          action: String!
        ): Cohost!
      }


      extend type Subscription {
        """
        Subscribes to cohost add/remove events.
        """
        
        cohostManaged: DataSubscription @pgSubscription(topic: "${COHOST_EVENT}")
      }
    `,
    resolvers: {
      Mutation: {
        async manageCohost(_parent, { userId, sessionId, cohostId, action }, { pgClient }) {
      
          try {
            const sessionQuery = `
            SELECT jsonb_path_query(session, '$.info[0].sessions ? (@.session_id == "${sessionId}")') AS session
            FROM users 
            WHERE id = '${userId}'
          `;
          const { rows: sessionRows } = await pgClient.query(sessionQuery);
          console.log("Session Rows:", sessionRows);

          if (sessionRows.length === 0 || !sessionRows[0].session) {
            return "Session not found";
          }

          const updateQuery = `
            UPDATE users 
            SET session = jsonb_set(
              session, 
              '{info,0,sessions}', 
              (
                SELECT jsonb_agg(
                  CASE 
                    WHEN session_item->>'session_id' = '${sessionId}' THEN 
                      jsonb_set(session_item, '{co_hosts}', 
                        CASE 
                          WHEN '${action}' = 'add' THEN 
                            COALESCE(session_item->'co_hosts', '[]'::jsonb) || 
                            jsonb_build_object('co_host_id', '${cohostId}', 'is_remove', false, 'created_at', now(), 'updated_at', now())
                          WHEN '${action}' = 'remove' THEN 
                            COALESCE(
                              (SELECT jsonb_agg(cohost)
                                FROM jsonb_array_elements(session_item->'co_hosts') AS cohost
                                WHERE cohost->>'co_host_id' != '${cohostId}'
                              ), 
                              '[]'::jsonb
                            )
                          ELSE session_item->'co_hosts'
                        END
                      )
                    ELSE session_item  
                  END
                ) 
                FROM jsonb_array_elements(session->'info'->0->'sessions') AS session_item
              )
            )
            WHERE id = '${userId}' 
            AND jsonb_path_exists(session, '$.info[0].sessions ? (@.session_id == "${sessionId}")')
          `;

          await pgClient.query(updateQuery);
            const message =
              action === "add"
                ? "Cohost added successfully"
                : action === "remove"
                ? "Cohost removed successfully"
                : "Invalid action.Use either add or remove";

            return {
              message,
              userId,
              sessionId,
              cohostId,
              action,
            };
          } catch (error) {
            console.error("Error managing cohost:", error);
            return {
              message: "An error occurred",
              userId,
              sessionId,
              cohostId,
              action,
            };
          }
        },
      },

      Subscription: {
        cohostManaged: {
          resolve(payload: any) {
            try {
              const parsed =
                typeof payload === "string" ? JSON.parse(payload) : payload;
      
              return {
                operation: parsed.operation,
                old: parsed.old,
                new: parsed.new,
              };
            } catch (error) {
              console.error("Failed to parse subscription payload:", error);
              return null;
            }
        },
      },
    },
  },
}});

export default cohostPlugin;
