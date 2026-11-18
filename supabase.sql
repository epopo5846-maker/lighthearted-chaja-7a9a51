-- =========================================================
-- EDUMANAGE: TABLAS PARA SUPABASE
-- Ejecuta este script en Supabase > SQL Editor > New query.
-- =========================================================

create extension if not exists pgcrypto;

create table if not exists public.estudiantes (
    id uuid primary key default gen_random_uuid(),
    matricula text not null unique,
    nombres text not null,
    apellidos text not null,
    correo text not null unique,
    telefono text,
    carrera text not null,
    estado text not null default 'Activo'
        check (estado in ('Activo', 'Inactivo')),
    created_at timestamptz not null default now()
);

create table if not exists public.asistencias (
    id uuid primary key default gen_random_uuid(),
    estudiante_id uuid not null
        references public.estudiantes(id) on delete cascade,
    fecha date not null,
    estado text not null
        check (estado in ('Presente', 'Ausente', 'Tardanza', 'Excusa')),
    observacion text,
    created_at timestamptz not null default now(),
    constraint asistencia_unica_por_estudiante_fecha
        unique (estudiante_id, fecha)
);

create index if not exists idx_asistencias_fecha
    on public.asistencias(fecha);

-- Activar RLS en ambas tablas.
alter table public.estudiantes enable row level security;
alter table public.asistencias enable row level security;

-- POLÍTICAS TEMPORALES PARA PRUEBAS:
-- Permiten acceso público con la clave anon/publishable.
-- No uses estas políticas con datos reales ni publiques el proyecto así.
-- Para producción, configura Supabase Auth y políticas para authenticated.

create policy "pruebas_publicas_estudiantes"
on public.estudiantes
for all
to anon
using (true)
with check (true);

create policy "pruebas_publicas_asistencias"
on public.asistencias
for all
to anon
using (true)
with check (true);

-- IMPORTANTE:
-- Si vuelves a ejecutar el script y una política ya existe,
-- elimina la política anterior desde Table Editor > Policies
-- o ejecuta DROP POLICY antes de crearla nuevamente.
