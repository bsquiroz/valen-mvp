-- La descripción del curso es obligatoria (ES y EN). admin_save_courses guarda null si no viene,
-- así que la restricción hace fallar todo el guardado en ese caso.
alter table public.courses alter column description set not null;
