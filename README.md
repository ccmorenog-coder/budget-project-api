# @ccmorenog-coder/budget-api

> Backend de alto rendimiento para el control de finanzas personales (Colombia Fiscal 2026).

API REST construida con **NestJS 11**, **Prisma 7**, **PostgreSQL 16** y validación mediante **Zod v4**.

---

## 🏗️ Stack Tecnológico

- **Framework**: NestJS v11.1.16
- **ORM**: Prisma v7.4.2 (con PrismaPg adapter)
- **Validación**: Zod v4.3.6 (vía `@ccmorenog-coder/budget-shared`)
- **Autenticación**: JWT (Access & Refresh tokens) con Passport.js
- **Base de Datos**: PostgreSQL 16 (en Docker puerto 5433)

---

## 🛠️ Prerrequisitos

- **Node.js**: v22.13.1 (LTS)
- **Docker**: Para la base de datos local.
- **Acceso a GitHub Packages**: Requiere un PAT con permisos de lectura para `@ccmorenog-coder/budget-shared`.

---

## 🚀 Inicio Rápido (Desarrollo)

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar base de datos local
docker compose -f docker-compose.dev.yml up -d

# 3. Aplicar migraciones y seed de negocio (UVT 2026, Categorías, Entidades)
npx prisma migrate dev
npx prisma db seed

# 4. Iniciar servidor de desarrollo
npm run start:dev
```

---

## 📋 Variables de Entorno (.env)

| Variable | Valor Sugerido | Descripción |
|----------|----------------|-------------|
| `DATABASE_URL` | `postgresql://...:5433/budget_dev` | Conexión a la DB local |
| `JWT_SECRET` | `secret-key-aquí` | Firma de tokens de acceso |
| `INTERNAL_API_URL` | `http://localhost:3001` | Punto de entrada del API |

---

## 🧪 Testing y Calidad

- `npm run test`: Ejecuta tests unitarios.
- `npm run build`: Genera el build de producción en `dist/`.
- `npm run lint`: Verifica el cumplimiento de estándares de código.

---

## 🗺️ Visión del Negocio (Colombia 2026)

Este API implementa reglas de negocio avanzadas para:
- Cálculos basados en **UVT** (actualización automática anual).
- Límites de **Depósitos de Bajo Monto (DBM)**.
- Exención de **GMF (4x1000)** en la cuenta principal.
- Soporte para **Primas semestrales** e ingresos variables.

---

## ⚖️ Licencia
ISC - Propiedad de ccmorenog-coder.
<!-- ia-scaffolding:managed -->
