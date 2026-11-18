# EduManage conectado directamente a Supabase

## Estructura
- index.html
- css/style.css
- js/estudiantes.js
- supabase.sql

## 1. Crear las tablas
1. Entra en tu proyecto de Supabase.
2. Abre SQL Editor.
3. Selecciona New query.
4. Copia el contenido de `supabase.sql`.
5. Pulsa Run.

El script crea `estudiantes` y `asistencias`, la relación entre ellas y la restricción que evita duplicar la asistencia del mismo estudiante en la misma fecha.

## 2. Copiar las credenciales
En Supabase abre Project Settings > API (o Connect, según la interfaz):
- Project URL
- Publishable key (o la clave anon heredada)

No copies `service_role` ni una Secret key.

## 3. Pegar las credenciales
Abre `js/estudiantes.js` y sustituye:

const SUPABASE_URL = "PEGA_AQUI_TU_PROJECT_URL";
const SUPABASE_KEY = "PEGA_AQUI_TU_PUBLISHABLE_O_ANON_KEY";

por tus valores reales.

## 4. Abrir el proyecto
Abre la carpeta completa en VS Code y ejecuta `index.html` con Live Server.
No abras el HTML como archivo local `file://`.

## 5. Probar
1. Comprueba que arriba aparezca “Conectado a Supabase”.
2. Registra un estudiante de prueba.
3. Revisa Supabase > Table Editor > estudiantes.
4. Marca su asistencia en una fecha y pulsa Guardar asistencia.
5. Revisa la tabla asistencias.
6. Prueba consultar otra fecha y exportar PDF, DOCX o TXT.

## Seguridad: muy importante
El SQL incluido crea políticas públicas temporales para facilitar la primera prueba desde el navegador. Eso significa que cualquier persona que obtenga la URL y la clave pública podría leer, modificar o borrar los datos mientras esas políticas estén activas. La clave pública no es una contraseña.

No introduzcas datos reales de estudiantes ni publiques la aplicación con esas políticas. Antes de usarla de verdad, configura Supabase Auth (inicio de sesión) y cambia las políticas para que solo usuarios autenticados y autorizados puedan acceder. Nunca coloques la `service_role` o una Secret key en JavaScript.

## Cómo funciona
`supabase-js` es el cliente oficial de Supabase para JavaScript. Tu navegador lo usa para enviar consultas a Supabase. No escribes una API con Flask, aunque Supabase sí ofrece una API internamente.
