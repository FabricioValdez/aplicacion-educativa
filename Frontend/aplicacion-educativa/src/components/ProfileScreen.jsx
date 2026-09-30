import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  Crown,
  Eye,
  EyeOff,
  Flame,
  KeyRound,
  Lock,
  LogOut,
  Save,
  Shield,
  Smile,
  Sparkles,
  Star,
  User,
} from "lucide-react";
import { updateUserProfile } from "../api";
import { useUser } from "../context/useUser";
import { AVATAR_MAP, getAvatarEmoji } from "../utils/avatarHelper";

const availableAvatars = [
  { id: "astronaut", emoji: "🚀", label: "Astronauta" },
  { id: "dino", emoji: "🦖", label: "Dinosaurio" },
  { id: "cat", emoji: "🐱", label: "Gatito" },
  { id: "robot", emoji: "🤖", label: "Robot" },
  { id: "star", emoji: "⭐", label: "Estrella" },
  { id: "lion", emoji: "🦁", label: "León" },
];

export default function ProfileScreen({ onBack = () => {}, onLogout = () => {} }) {
  const { user, setUser } = useUser();

  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "astronaut");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!name.trim()) {
      setError("El nombre no puede estar vacío.");
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        setError("Debes ingresar tu clave actual para establecer una nueva.");
        return;
      }
      if (newPassword.length < 3) {
        setError("La nueva clave debe tener al menos 3 caracteres.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("La confirmación de la nueva clave no coincide.");
        return;
      }
    }

    try {
      setSaving(true);
      const res = await updateUserProfile(user.id, {
        name: name.trim(),
        avatar,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      if (res.user) {
        setUser((prev) => ({ ...prev, ...res.user }));
      }

      setSuccessMsg("¡Perfil actualizado con éxito! ✨");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      setError(err.message || "Error al actualizar el perfil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-[#F8FAFC] px-4 sm:px-6 py-5 sm:py-7 pb-28 text-slate-800">
      <div className="mx-auto max-w-md sm:max-w-lg md:max-w-xl">
        {/* Cabecera superior con botón Volver */}
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 font-heading text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </button>
          <span className="font-heading text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Ajustes de Perfil
          </span>
        </header>

        {/* Tarjeta de Resumen del Usuario */}
        <section className="mt-5 rounded-3xl border-2 border-[#D5E5FF] bg-gradient-to-br from-white to-[#F0F7FF] p-6 text-center shadow-soft">
          <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-full border-4 border-[#0284C7] bg-white text-5xl shadow-card">
            {getAvatarEmoji(avatar)}
            {user?.hasSubscription && (
              <span
                className="absolute -top-2 -right-2 grid h-8 w-8 place-items-center rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-sm shadow-md"
                title="Pase VIP Cósmico Activo"
              >
                👑
              </span>
            )}
          </div>
          <h1 className="mt-3 font-heading text-2xl font-black text-slate-900">{name || "Explorador"}</h1>
          <p className="font-heading text-xs font-bold uppercase tracking-wider text-blue-600">
            {user?.role === "adult" ? "Profesor / Tutor 👨‍🏫" : "Explorador Espacial 🚀"}
          </p>

          {/* Estadísticas Rápidas */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-2.5">
              <div className="flex items-center justify-center gap-1 text-amber-700">
                <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                <span className="font-heading text-sm font-black">{user?.points ?? 0}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Puntos ⭐</span>
            </div>

            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-2.5">
              <div className="flex items-center justify-center gap-1 text-orange-700">
                <Flame className="h-4 w-4 fill-orange-500 text-orange-600" />
                <span className="font-heading text-sm font-black">{user?.streakDays ?? 0}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Racha</span>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-2.5">
              <div className="flex items-center justify-center gap-1 text-sky-700">
                <Shield className="h-4 w-4 text-sky-600" />
                <span className="font-heading text-sm font-black">{user?.streakShields ?? 2}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Escudos</span>
            </div>
          </div>

          {user?.hasSubscription && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100/70 px-3.5 py-1 text-xs font-black text-amber-900 shadow-sm">
              <Crown className="h-4 w-4 text-amber-600" />
              <span>Pase Cósmico VIP • Vidas Infinitas Activas</span>
            </div>
          )}
        </section>

        {successMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs font-black text-emerald-800">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-2xl border border-red-300 bg-red-50 p-3.5 text-xs font-black text-red-700">
            {error}
          </div>
        )}

        {/* Formulario de Personalización */}
        <form onSubmit={handleSave} className="mt-5 rounded-3xl border-2 border-[#D5E5FF] bg-white p-6 shadow-soft space-y-5">
          {/* Selector de Avatar */}
          <div>
            <label className="block text-left font-heading text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
              Cambia tu Mascota / Avatar
            </label>
            <div className="grid grid-cols-6 gap-2">
              {availableAvatars.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setAvatar(av.id)}
                  className={`flex flex-col items-center justify-center rounded-2xl p-2 border-2 transition ${
                    avatar === av.id
                      ? "border-[#0284C7] bg-[#EFF6FF] scale-105 shadow-sm"
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                  title={av.label}
                >
                  <span className="text-2xl">{av.emoji}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-left font-heading text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
              Tu Nombre
            </label>
            <div className="relative">
              <Smile className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#0284C7]" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de explorador"
                className="w-full rounded-2xl border-2 border-[#D5E5FF] bg-[#EFF6FF] pl-12 pr-4 py-3 font-heading text-sm font-bold text-slate-800 outline-none focus:border-[#0284C7]"
              />
            </div>
          </div>

          {/* Cambio de Contraseña (Opcional) */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500">
              <KeyRound className="h-4 w-4" />
              <span>Cambiar Clave Secreta (Opcional)</span>
            </div>

            <div>
              <label className="block text-left text-[11px] font-bold text-slate-500 mb-1">
                Clave secreta actual
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Tu clave actual"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-10 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#0284C7]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-left text-[11px] font-bold text-slate-500 mb-1">
                  Nueva clave
                </label>
                <input
                  type={showPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nueva clave"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-left text-[11px] font-bold text-slate-500 mb-1">
                  Confirmar nueva
                </label>
                <input
                  type={showPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#0284C7]"
                />
              </div>
            </div>
          </div>

          {/* Botón Guardar */}
          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0284C7] py-3.5 font-heading text-sm font-extrabold text-white shadow-button hover:bg-[#0369A1] transition active:scale-98 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Guardando cambios..." : "Guardar Cambios"}</span>
          </button>
        </form>

        {/* Botón Cerrar Sesión */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-full border-2 border-red-200 bg-red-50/70 px-6 py-2.5 font-heading text-xs font-black text-red-600 hover:bg-red-100 transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </main>
  );
}
