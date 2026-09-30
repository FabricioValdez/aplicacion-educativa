# 🚀 Guía de Despliegue en Render con PostgreSQL - QuestWorld

Esta guía te explica paso a paso cómo desplegar la plataforma educativa **QuestWorld** en [Render](https://render.com) utilizando una base de datos gestionada **PostgreSQL**.

El proyecto ya incluye:
1. **Auto-inicialización de Base de Datos**: Al iniciar el servidor por primera vez, crea automáticamente las tablas en PostgreSQL y siembra los datos iniciales (retos, 8 ligas, logros, catálogo de actividades y usuarios de prueba).
2. **Adaptador Universal Dual**: Compatible tanto con PostgreSQL (Render) como con MySQL (desarrollo local).
3. **Infraestructura como Código (`render.yaml`)**: Para desplegar todo con un solo clic.

---

## 🛠️ Arquitectura de la Solución en Render

- 🐘 **Base de Datos**: PostgreSQL Gestionado (`aplicacion-educativa-db`).
- ⚡ **Backend API**: Web Service en Node.js Express (`aplicacion-educativa-api`).
- 🎨 **Frontend Web**: Static Site en React + Vite + TailwindCSS (`aplicacion-educativa-web`).

---

## 🌟 Opción 1: Despliegue con 1 Clic usando Blueprint (Recomendado)

Render cuenta con la función **Blueprints**, la cual lee el archivo `render.yaml` incluido en la raíz de tu repositorio y configura automáticamente la base de datos, el backend y el frontend conectados entre sí.

### Pasos:
1. Ve a [dashboard.render.com](https://dashboard.render.com) e inicia sesión con tu cuenta de GitHub (`FabricioValdez`).
2. En el panel principal, haz clic en el botón superior **"New +"** y selecciona **"Blueprint"**.
3. Conecta y selecciona el repositorio:
   ```
   FabricioValdez/aplicacion-educativa
   ```
4. Asigna un nombre al Blueprint (por ejemplo: `questworld-deploy`) y selecciona la rama `main`.
5. Render analizará el archivo `render.yaml` y te mostrará los 3 recursos que creará:
   - **PostgreSQL**: `aplicacion-educativa-db` (Plan Free).
   - **Web Service**: `aplicacion-educativa-api` (Plan Free, en `./Backend`).
   - **Static Site**: `aplicacion-educativa-web` (Plan Free, en `./Frontend/aplicacion-educativa`).
6. Haz clic en **"Apply"** (Aplicar).
7. ¡Listo! Render comenzará el aprovisionamiento.
   - Primero creará la base de datos PostgreSQL.
   - Luego compilará e iniciará el backend (este migrará y sembrará la BD automáticamente).
   - Finalmente compilará el frontend y generará tu URL pública HTTPS (ej. `https://aplicacion-educativa-web.onrender.com`).

---

## 🧩 Opción 2: Despliegue Manual Paso a Paso (Panel de Render)

Si prefieres crear cada servicio manualmente desde el panel de Render, sigue estos sencillos pasos:

### Paso 1: Crear la Base de Datos PostgreSQL
1. En Render, haz clic en **"New +"** -> **"PostgreSQL"**.
2. Completa los campos:
   - **Name**: `aplicacion-educativa-db`
   - **Database**: `aplicacion_educativa`
   - **User**: `aplicacion_user`
   - **Region**: Oregon (US West) o la que prefieras.
   - **Plan**: Free.
3. Haz clic en **"Create Database"**.
4. Una vez creada, en la pestaña *Info* busca la sección **"Connections"** y copia la **"Internal Database URL"** (comienza con `postgres://...`).

---

### Paso 2: Crear el Backend (Web Service)
1. En Render, haz clic en **"New +"** -> **"Web Service"**.
2. Conecta el repositorio `FabricioValdez/aplicacion-educativa`.
3. Configura los parámetros:
   - **Name**: `aplicacion-educativa-api`
   - **Language / Runtime**: `Node`
   - **Root Directory**: `Backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free.
4. Despliega la sección **"Environment Variables"** y añade:
   - `DATABASE_URL`: *(Pega la Internal Database URL que copiaste en el Paso 1)*
   - `NODE_ENV`: `production`
5. Haz clic en **"Create Web Service"**.
6. Espera a que termine el despliegue. En los logs verás:
   ```
   [PostgreSQL] Conexión establecida exitosamente
   [AutoInit] Comprobando estado de la base de datos (PostgreSQL)...
   [AutoInit] ✔ Esquema de tablas creado exitosamente.
   [AutoInit] ✔ Base de datos verificada y lista para servir peticiones.
   QuestWorld API escuchando en el puerto 10000
   ```
7. Copia la URL pública que Render le asigna a tu backend (ejemplo: `https://aplicacion-educativa-api.onrender.com`).

---

### Paso 3: Crear el Frontend (Static Site)
1. En Render, haz clic en **"New +"** -> **"Static Site"**.
2. Conecta el repositorio `FabricioValdez/aplicacion-educativa`.
3. Configura los parámetros:
   - **Name**: `aplicacion-educativa-web`
   - **Root Directory**: `Frontend/aplicacion-educativa`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. En **"Environment Variables"**, añade:
   - `VITE_API_URL`: `https://aplicacion-educativa-api.onrender.com/api` *(Usa la URL de tu backend del Paso 2 añadiendo `/api` al final)*.
5. Haz clic en **"Create Static Site"**.
6. Render compilará tu aplicación Vite y te proporcionará tu enlace final (ejemplo: `https://aplicacion-educativa-web.onrender.com`).

---

## 🧪 Cuentas de Acceso para Probar la App

Una vez abierta tu URL en el navegador o teléfono móvil, puedes iniciar sesión con las siguientes cuentas de prueba precargadas:

- **Cuenta de Alumno / Explorador**:
  - Rol: `Niño / Explorador`
  - Nombre: `Estudiante`
  - Clave: `1234`
- **Cuenta de Docente / Tutor**:
  - Rol: `Adulto / Tutor`
  - Nombre: `Profesor Carlos`
  - Clave: `1234`
- O puedes hacer clic en **"¡Crear una cuenta nueva!"** para registrar a un nuevo estudiante o profesor.

---

## 📌 Consideraciones del Plan Gratuito de Render

- **Inactividad (Spin down)**: En el plan Free, si no hay visitas durante 15 minutos, el backend entra en reposo. Cuando un usuario entra después de ese tiempo, la primera petición puede tardar entre 30 y 50 segundos mientras el contenedor se despierta. Las siguientes peticiones responderán al instante.
- **Persistencia PostgreSQL**: La base de datos mantiene todos los usuarios, clases, ejercicios, insignias y progreso creados.
