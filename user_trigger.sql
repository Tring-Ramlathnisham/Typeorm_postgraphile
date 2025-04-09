
CREATE OR REPLACE FUNCTION notify_users()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
  BEGIN
    PERFORM pg_notify(
      'postgraphile:public.users', 
      json_build_object(
        'operation', TG_OP,             -- Operation type (INSERT, UPDATE, DELETE)
        'old', to_jsonb(OLD),           -- OLD row data (null for INSERT)
        'new', to_jsonb(NEW)            -- NEW row data (null for DELETE)
      )::text
    );
    
    RETURN COALESCE(NEW, OLD);  -- Return NEW for INSERT/UPDATE, OLD for DELETE
  END;
$function$;

CREATE TRIGGER users_update
AFTER INSERT OR UPDATE OR DELETE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.notify_users();
