import { Router } from "express";
import Stripe from "stripe";
import { pool } from "../config/database.js";
import { config } from "../config/env.js";
import { getUserFullDetails } from "../db/user.repository.js";
import { publicUser, requireUser } from "../middlewares/auth.middleware.js";

const router = Router();
const stripe = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;

const PACKAGES = {
  lives_refill: {
    name: "Paquete Recarga Completa (3 Vidas)",
    amount: 199,
  },
  streak_shield: {
    name: "Paquete 2 Protectores de Racha 🛡️",
    amount: 199,
  },
  vip_subscription: {
    name: "Pase Cósmico VIP (Vidas Infinitas) 👑",
    amount: 499,
  },
};

router.post("/create-checkout-session", requireUser, async (request, response) => {
  if (!stripe) {
    return response.status(503).json({
      message: "Stripe no está configurado. Define STRIPE_SECRET_KEY en el backend.",
    });
  }

  const { userId, packageType = "lives_refill" } = request.body ?? {};
  if (userId && userId !== request.user.id) {
    return response.status(403).json({ message: "El usuario del pago no coincide con la sesión." });
  }

  const pkg = PACKAGES[packageType];
  if (!pkg) {
    return response.status(400).json({ message: "Paquete no válido." });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: pkg.amount,
            product_data: { name: pkg.name },
          },
        },
      ],
      metadata: { userId: request.user.id, packageType },
      success_url: `${config.allowedOrigin}/?stripe_session_id={CHECKOUT_SESSION_ID}&package_type=${packageType}`,
      cancel_url: `${config.allowedOrigin}/?payment_cancelled=1`,
    });

    return response.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    return response.status(502).json({
      message: "No se pudo iniciar el pago con Stripe.",
      detail: error.message,
    });
  }
});

router.post("/mock-checkout", requireUser, async (request, response) => {
  if (!config.mockPayments) {
    return response.status(409).json({
      message: "El modo mock está desactivado porque Stripe está configurado.",
    });
  }

  const { packageType = "lives_refill" } = request.body ?? {};
  const userId = request.user.id;

  await new Promise((resolve) => setTimeout(resolve, 800));

  if (packageType === "streak_shield") {
    await pool.query("UPDATE users SET streak_shields = streak_shields + 2 WHERE id = ?", [userId]);
    const updated = await getUserFullDetails(userId);
    return response.json({
      success: true,
      packageType,
      message: "¡Pago simulado exitoso! Se agregaron 2 protectores de racha 🛡️",
      streakShields: updated.streakShields,
      user: publicUser(updated),
    });
  }

  if (packageType === "vip_subscription") {
    await pool.query("UPDATE users SET has_subscription = TRUE WHERE id = ?", [userId]);
    const updated = await getUserFullDetails(userId);
    return response.json({
      success: true,
      packageType,
      message: "¡Pago simulado exitoso! Pase Cósmico VIP activado con vidas infinitas 👑",
      hasSubscription: true,
      user: publicUser(updated),
    });
  }

  return response.json({
    success: true,
    packageType,
    message: "Pago simulado exitoso",
    lives: 3,
  });
});

router.post("/confirm", requireUser, async (request, response) => {
  if (!stripe) {
    return response.status(503).json({
      message: "Stripe no está configurado. Define STRIPE_SECRET_KEY en el backend.",
    });
  }

  const { sessionId } = request.body ?? {};
  if (!sessionId) {
    return response.status(400).json({ message: "Falta el identificador de la sesión de pago." });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const userId = request.user.id;
    const isValidPayment =
      session.payment_status === "paid" && session.metadata?.userId === userId;

    if (!isValidPayment) {
      return response.status(400).json({ message: "El pago no está confirmado." });
    }

    const packageType = session.metadata?.packageType || "lives_refill";

    if (packageType === "streak_shield") {
      await pool.query("UPDATE users SET streak_shields = streak_shields + 2 WHERE id = ?", [userId]);
      const updated = await getUserFullDetails(userId);
      return response.json({
        confirmed: true,
        packageType,
        message: "Protectores de racha agregados exitosamente.",
        user: publicUser(updated),
      });
    }

    if (packageType === "vip_subscription") {
      await pool.query("UPDATE users SET has_subscription = TRUE WHERE id = ?", [userId]);
      const updated = await getUserFullDetails(userId);
      return response.json({
        confirmed: true,
        packageType,
        message: "Suscripción VIP activada exitosamente con vidas infinitas.",
        user: publicUser(updated),
      });
    }

    return response.json({
      confirmed: true,
      packageType,
      lives: 3,
      message: "Vidas recargadas exitosamente.",
    });
  } catch (error) {
    return response.status(502).json({
      message: "No se pudo confirmar el pago.",
      detail: error.message,
    });
  }
});

export default router;
