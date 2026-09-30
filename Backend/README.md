# QuestWorld Backend

API ligera de Express para el prototipo de QuestWorld.

## Ejecutar

```bash
npm install
npm run dev
```

La API queda disponible en `http://localhost:4000`.

Para activar Stripe, define `STRIPE_SECRET_KEY=sk_test_...` y, si el frontend usa otro origen, `FRONTEND_URL=http://localhost:5173`.

Sin `STRIPE_SECRET_KEY`, el backend activa automáticamente el modo mock y `POST /api/payments/mock-checkout` simula una compra tras un segundo.

Credenciales demo:

- Nombre: `Mateo el Astronauta`
- Clave: `1234`
- Perfil: `Soy Niño`

Rutas principales:

- `POST /api/auth/login`
- `GET /api/profile`
- `GET /api/challenges/daily`
- `POST /api/challenges/daily/progress`
- `POST /api/user/progress`
- `POST /api/payments/create-checkout-session`
- `POST /api/payments/mock-checkout`
- `POST /api/payments/confirm`
- `GET /api/activities/:activityId`
- `POST /api/activities/:activityId/answer`

Las rutas protegidas reciben el identificador devuelto por login en el header `x-user-id`.
