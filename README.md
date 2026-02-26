# budget-app — API

> API REST de gestión financiera personal para el contexto fiscal colombiano.

Construido con **NestJS** · **Prisma v7** · **PostgreSQL 16** · **PrismaPg adapter**

---

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| Framework | NestJS 10 |
| ORM | Prisma 7 (driver adapter: PrismaPg) |
| Base de datos | PostgreSQL 16 |
| Auth | NextAuth.js v5 (JWT rotante + PKCE) |
| Runtime | Node.js ≥ 20 |
| Contenedor dev | Docker Compose (PostgreSQL en puerto 5433) |

---

## Prerrequisitos

- Node.js ≥ 20
- Docker + Docker Compose
- Copiar `.env.example` → `.env` y completar los valores

---

## Setup local

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar la base de datos
docker compose -f docker-compose.dev.yml up -d

# 3. Aplicar migraciones
npx prisma migrate dev

# 4. Ejecutar seed inicial
npx prisma db seed

# 5. Iniciar el servidor de desarrollo
npm run start:dev
```

La API queda disponible en `http://localhost:3001`.

---

## Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Cadena de conexión PostgreSQL | `postgresql://budget_user:pass@localhost:5433/budget_dev` |
| `NODE_ENV` | Entorno | `development` |
| `PORT` | Puerto del servidor | `3001` |
| `SERVER_MASTER_SECRET` | Secreto maestro para cifrado AES-256 | `string-largo-aleatorio` |
| `JWT_SECRET` | Secreto para firmar JWT | `change-this` |
| `JWT_EXPIRATION` | TTL del access token | `15m` |
| `JWT_REFRESH_EXPIRATION` | TTL del refresh token | `7d` |

> Ver `.env.example` para la lista completa.

---

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run start:dev` | Servidor con watch mode |
| `npm run build` | Compilar TypeScript |
| `npm run start:prod` | Ejecutar build compilado |
| `npm run test` | Tests unitarios |
| `npm run test:e2e` | Tests end-to-end |
| `npm run test:cov` | Reporte de cobertura |
| `npx prisma migrate dev --name <desc>` | Crear y aplicar nueva migración |
| `npx prisma db seed` | Ejecutar seed (parámetros fiscales, categorías, entidades) |
| `npx prisma studio` | Visor visual de la base de datos |

---

## Base de datos

- **Schema**: `prisma/schema.prisma` — fuente de verdad
- **Migración inicial**: `20260225234738_init` — todos los modelos del plan It.0
- **Seed incluye**: parámetros fiscales 2026 (UVT, SMLMV, GMF, topes DBM), app_config, 11 categorías sistema con subcategorías, 19 entidades financieras colombianas

```bash
# Reset completo (solo dev — destruye todos los datos)
npx prisma migrate reset

# Ver datos en el navegador
npx prisma studio
```

---

## Visión general de la API

- **Base URL**: `http://localhost:3001/api`
- **Auth**: Bearer JWT — header `Authorization: Bearer <token>` en rutas protegidas
- **Docs Swagger**: `http://localhost:3001/api/docs` *(disponible en It.1)*

---

## Documentación

Decisiones de arquitectura, reglas de negocio y modelo de datos:
→ `project-docs/budget-app/`
