-- Rol super_admin: puede todo, incluida la gestión de admins y los datos de los usuarios.
-- Va en su propia migración: un valor nuevo de enum no se puede usar en la misma transacción.
alter type public.app_role add value 'super_admin';
