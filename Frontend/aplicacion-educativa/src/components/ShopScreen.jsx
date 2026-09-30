import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  CheckCircle,
  Crown,
  Flame,
  Infinity as InfinityIcon,
  Shield,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import {
  buyShieldWithPoints,
  createCheckoutSession,
  mockCheckout,
} from "../api";
import { useUser } from "../context/useUser";
import AppLayout from "./AppLayout";

export default function ShopScreen({ onLogout, onNavigate = () => {}, onStreak }) {
  const { user, setUser } = useUser();

  const [loadingPointsShield, setLoadingPointsShield] = useState(false);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [loadingMock, setLoadingMock] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const currentPoints = user?.points ?? 0;
  const currentShields = user?.streakShields ?? 2;
  const hasSubscription = Boolean(user?.hasSubscription);

  const showNotification = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3500);
  };

  // 1. Compra de 1 protector con 500 Puntos
  const handleBuyShieldPoints = async () => {
    if (currentPoints < 500) {
      showNotification(`Necesitas 500 ⭐ puntos. Tienes ${currentPoints} ⭐. ¡Resuelve lecciones para ganar más!`, "error");
      return;
    }

    try {
      setLoadingPointsShield(true);
      const res = await buyShieldWithPoints(user.id);
      if (res.success) {
        setUser((prev) => ({
          ...prev,
          points: res.points,
          streakShields: res.streakShields,
        }));
        showNotification(res.message || "¡Compraste 1 protector de racha por 500 puntos! 🛡️");
      }
    } catch (err) {
      showNotification(err.message || "Error al comprar protector.", "error");
    } finally {
      setLoadingPointsShield(false);
    }
  };

  // 2. Compra con Stripe o Mock
  const handlePayment = async (packageType) => {
    const hasStripePublishableKey = Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
    const useMockPayments = import.meta.env.VITE_MOCK_PAYMENTS === "true" || !hasStripePublishableKey;

    if (useMockPayments) {
      try {
        setLoadingMock(true);
        const res = await mockCheckout(user.id, packageType);
        if (res.user) {
          setUser((prev) => ({ ...prev, ...res.user }));
        }
        showNotification(res.message);
      } catch (err) {
        showNotification(err.message || "Error en el pago.", "error");
      } finally {
        setLoadingMock(false);
      }
      return;
    }

    try {
      setLoadingStripe(true);
      const { sessionId, url } = await createCheckoutSession(user.id, packageType);
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      if (stripe && sessionId) {
        await stripe.redirectToCheckout({ sessionId });
        return;
      }
      if (url) {
        window.location.assign(url);
        return;
      }
      throw new Error("No se pudo iniciar el checkout.");
    } catch (err) {
      showNotification(err.message || "Error con Stripe.", "error");
    } finally {
      setLoadingStripe(false);
    }
  };

  // Botón directo para prueba rápida en caso de no tener Stripe configurado
  const handleDirectMock = async (packageType) => {
    try {
      setLoadingMock(true);
      const res = await mockCheckout(user.id, packageType);
      if (res.user) {
        setUser((prev) => ({ ...prev, ...res.user }));
      }
      showNotification(res.message);
    } catch (err) {
      showNotification(err.message || "Error en el pago simulado.", "error");
    } finally {
      setLoadingMock(false);
    }
  };

  return (
    <AppLayout
      activeItem="tienda"
      onLogout={onLogout}
      onNavigate={onNavigate}
      onStreak={onStreak}
    >
      {/* Cabecera */}
      <header className="flex items-center justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 font-heading text-xs font-black text-amber-900">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>Tienda Galáctica</span>
          </span>
          <h1 className="mt-1.5 font-heading text-2xl font-extrabold text-slate-900">
            Mejoras y Poderes 🛍️
          </h1>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            Adquiere escudos de racha y vidas infinitas
          </p>
        </div>

        {/* Contador de puntos actual */}
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-3.5 py-2 text-right shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-500 block">Tus Puntos</span>
          <span className="font-heading text-base font-black text-amber-900">
            ⭐ {currentPoints}
          </span>
        </div>
      </header>

      {msg.text && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-2xl border p-3.5 text-xs font-black transition ${
            msg.type === "error"
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-emerald-300 bg-emerald-50 text-emerald-800"
          }`}
        >
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{msg.text}</span>
        </div>
      )}

      {/* SECCIÓN 1: SUSCRIPCIÓN VIP / VIDAS INFINITAS */}
      <section className="mt-6 rounded-[2rem] border-2 border-amber-300 bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-300 p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/20 blur-xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/25 px-3 py-1 font-heading text-xs font-black text-amber-950 uppercase tracking-wider backdrop-blur-sm">
              <Crown className="h-4 w-4" />
              <span>Pase Cósmico VIP</span>
            </span>
            <span className="text-3xl">👑</span>
          </div>

          <h2 className="mt-3 font-heading text-2xl font-black text-amber-950 leading-tight">
            Vidas Infinitas Ilimitadas
          </h2>
          <p className="mt-1 text-xs font-bold text-amber-900/90 leading-snug">
            ¡Aprende sin límites! Si fallas en cualquier lección, tus vidas no se agotarán jamás y podrás seguir practicando.
          </p>

          <div className="mt-4 flex items-center gap-2 text-amber-950 font-heading text-sm font-black">
            <InfinityIcon className="h-5 w-5" />
            <span>Sin bloqueos por Game Over</span>
          </div>

          {hasSubscription ? (
            <div className="mt-5 rounded-2xl bg-white/90 p-4 text-center text-amber-950 shadow-md">
              <span className="inline-flex items-center gap-1.5 font-heading text-sm font-black text-emerald-800">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>¡Tu Suscripción VIP está Activa!</span>
              </span>
              <p className="mt-0.5 text-xs font-semibold text-slate-600">
                Disfrutas de vidas ilimitadas en todas tus materias.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={() => handlePayment("vip_subscription")}
                disabled={loadingStripe || loadingMock}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0284C7] py-3.5 font-heading text-sm font-black text-white shadow-button hover:bg-[#0369A1] transition active:scale-98 disabled:opacity-60"
              >
                <span>Suscribirme por $4.99 USD / mes 💳</span>
              </button>

              <button
                type="button"
                onClick={() => handleDirectMock("vip_subscription")}
                disabled={loadingMock}
                className="w-full text-center text-xs font-black text-amber-950 underline hover:text-white transition"
              >
                O activar con pago simulado de prueba ✨
              </button>
            </div>
          )}
        </div>
      </section>

      {/* SECCIÓN 2: PROTECTORES DE RACHA */}
      <section className="mt-7">
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="font-heading text-base font-extrabold text-slate-800 flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-blue-600" />
              <span>Protectores de Racha</span>
            </h2>
            <p className="text-xs text-slate-500 font-semibold">
              Salvan tu racha de fuego 🔥 si faltas un día a estudiar
            </p>
          </div>
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-1 font-heading text-xs font-black text-blue-700">
            Tienes: {currentShields} 🛡️
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Opción 1: Comprar con 500 Puntos (Muy caro para incentivar jugar lecciones) */}
          <div className="rounded-3xl border-2 border-[#D5E5FF] bg-white p-5 shadow-card transition hover:border-blue-300">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-2xl">
                  🛡️
                </span>
                <div>
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 font-heading text-[10px] font-black text-amber-800 uppercase">
                    Comprar con Esfuerzo
                  </span>
                  <h3 className="font-heading text-base font-extrabold text-slate-800">
                    1 Protector de Racha
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    Requiere jugar y acumular puntos en lecciones
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-heading text-lg font-black text-amber-800 block">
                  500 ⭐
                </span>
                <span className="text-[10px] text-slate-400 font-bold">Puntos XP</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBuyShieldPoints}
              disabled={loadingPointsShield}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3 font-heading text-xs font-extrabold transition shadow-sm ${
                currentPoints >= 500
                  ? "bg-[#0284C7] text-white hover:bg-[#0369A1] active:scale-98"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              {loadingPointsShield
                ? "Canjeando..."
                : currentPoints >= 500
                ? "Canjear por 500 Puntos ⭐"
                : `Te faltan ${500 - currentPoints} ⭐ para canjear`}
            </button>
          </div>

          {/* Opción 2: Paquete de 2 Protectores con Dinero / Stripe */}
          <div className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-card transition hover:border-blue-300">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-2xl">
                  🛡️🛡️
                </span>
                <div>
                  <span className="rounded-md bg-blue-100 px-2 py-0.5 font-heading text-[10px] font-black text-blue-800 uppercase">
                    Paquete Doble
                  </span>
                  <h3 className="font-heading text-base font-extrabold text-slate-800">
                    2 Protectores de Racha
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    Pago seguro con tarjeta o Stripe
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-heading text-lg font-black text-slate-800 block">
                  $1.99 USD
                </span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => handlePayment("streak_shield")}
                disabled={loadingStripe || loadingMock}
                className="flex-1 rounded-full bg-slate-900 py-3 font-heading text-xs font-extrabold text-white shadow-sm hover:bg-slate-800 transition active:scale-98 disabled:opacity-60"
              >
                Pagar con Stripe 💳
              </button>

              <button
                type="button"
                onClick={() => handleDirectMock("streak_shield")}
                disabled={loadingMock}
                className="rounded-full border border-blue-200 bg-blue-50 px-3.5 py-3 font-heading text-xs font-black text-blue-700 hover:bg-blue-100 transition"
                title="Pago simulado de prueba"
              >
                Prueba ✨
              </button>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
