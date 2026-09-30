import {
  Home,
  School,
  ShoppingBag,
  Star,
  Trophy,
} from "lucide-react";
import { useUser } from "../context/useUser";

export default function BottomNav({ onLogout = async () => {}, activeItem = "inicio", onNavigate = () => {} }) {
  const { user } = useUser();
  const isTeacher = user?.role === "adult";

  const navigationItems = [
    { id: "inicio", label: "Inicio", icon: Home },
    isTeacher
      ? { id: "clases", label: "Clases", icon: School }
      : { id: "liga", label: "Liga", icon: Trophy },
    { id: "logros", label: "Logros", icon: Star },
    { id: "tienda", label: "Tienda", icon: ShoppingBag },
  ];

  const handleNavigation = (itemId) => {
    onNavigate(itemId);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 mx-auto w-full max-w-md sm:max-w-xl md:max-w-2xl border-t border-slate-200 bg-white/95 px-3 sm:px-6 pt-2.5 sm:pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(15,23,42,0.06)] backdrop-blur-md"
      aria-label="Navegación principal"
    >
      <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id || (activeItem === "misiones" && item.id === "liga");
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigation(item.id)}
              aria-pressed={isActive}
              className={`group flex min-h-[56px] sm:min-h-[62px] flex-col items-center justify-center gap-1 rounded-2xl px-1.5 sm:px-2 py-1.5 transition-all duration-200 active:scale-95 touch-manipulation ${
                isActive
                  ? item.id === "liga" || item.id === "misiones"
                    ? "bg-[#FBBF24] text-[#78350F] shadow-[0_2px_0_#D97706]"
                    : item.id === "clases"
                    ? "bg-[#DBEAFE] text-[#1D4ED8] shadow-[0_2px_0_#93C5FD]"
                    : item.id === "logros"
                    ? "bg-[#FEF08A] text-[#854D0E] shadow-[0_2px_0_#FACC15]"
                    : item.id === "tienda"
                    ? "bg-[#FEF3C7] text-[#92400E] shadow-[0_2px_0_#FDE68A]"
                    : "bg-[#E0F2FE] text-[#0284C7] shadow-[0_2px_0_#BAE6FD]"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/70"
              }`}
            >
              <Icon
                className={`h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-200 ${
                  isActive ? "stroke-[2.5] scale-105 text-current" : "stroke-[2] text-slate-400 group-hover:text-slate-600"
                }`}
              />
              <span
                className={`font-heading text-[11px] sm:text-xs leading-tight transition-colors ${
                  isActive ? "font-extrabold text-current" : "font-bold text-slate-500 group-hover:text-slate-700"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}