import { useEffect, useState } from "react";
import { addUserPoints, checkUserStreak, getUserProfile } from "../api";
import { UserContext } from "./context";

function safeGetStoredUser() {
  try {
    const raw = sessionStorage.getItem("questworld_user");
    if (!raw || raw === "undefined" || raw === "null") return null;
    return JSON.parse(raw);
  } catch (e) {
    sessionStorage.removeItem("questworld_user");
    return null;
  }
}

function safeSetStoredUser(val) {
  try {
    if (val && typeof val === "object") {
      sessionStorage.setItem("questworld_user", JSON.stringify(val));
    } else {
      sessionStorage.removeItem("questworld_user");
    }
  } catch (e) {
    console.warn("Error guardando usuario en sessionStorage:", e);
  }
}

export function UserProvider({ children }) {
  const [user, setUserState] = useState(safeGetStoredUser);
  const [loading, setLoading] = useState(false);
  const [pointsPulse, setPointsPulse] = useState(null);

  const persistUser = (nextUser) => {
    setUserState((prev) => {
      const resolved = typeof nextUser === "function" ? nextUser(prev) : nextUser;
      safeSetStoredUser(resolved);
      return resolved;
    });
  };

  const fetchUserProfile = async (userId = user?.id) => {
    if (!userId) return null;
    try {
      const { user: profile } = await getUserProfile(userId);
      if (profile) {
        setUserState((prev) => {
          const merged = { ...prev, ...profile, points: Number(profile.points ?? 0) };
          safeSetStoredUser(merged);
          return merged;
        });
      }
      return profile;
    } catch (err) {
      console.warn("Aviso al refrescar perfil:", err.message);
      return null;
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    getUserProfile(user.id)
      .then(({ user: profile }) => {
        if (active && profile) {
          setUserState((prev) => {
            const merged = { ...prev, ...profile, points: Number(profile.points ?? 0) };
            safeSetStoredUser(merged);
            return merged;
          });
        }
      })
      .catch((err) => {
        console.warn("Aviso inicial de perfil:", err.message);
      });
    return () => {
      active = false;
    };
  }, [user?.id]); // Asegúrate de que SOLO dependa de user?.id y NO de user completo

  const addPoints = async (pointsToAdd, reason = "quiz") => {
    const parsed = Number(pointsToAdd);
    if (isNaN(parsed) || parsed <= 0) return;

    // 1. Incremento optimista inmediato
    setUserState((prev) => {
      const next = { ...prev, points: (Number(prev?.points) || 0) + parsed };
      safeSetStoredUser(next);
      return next;
    });

    setPointsPulse(`+${parsed} ⭐`);
    window.setTimeout(() => setPointsPulse(null), 1200);

    try {
      const activeUserId = user?.id || safeGetStoredUser()?.id || "1";
      const res = await addUserPoints(activeUserId, parsed, reason);
      if (res && (res.updatedPoints !== undefined || res.points !== undefined)) {
        const finalPoints = Number(res.updatedPoints ?? res.points);
        setUserState((prev) => {
          const next = { ...prev, points: finalPoints };
          safeSetStoredUser(next);
          return next;
        });
      }
    } catch (err) {
      console.error("Error al persistir en backend:", err);
    }
  };

  const checkStreak = async (userId = user?.id) => {
    if (!userId) return null;
    try {
      const result = await checkUserStreak(userId);
      const baseUser = user?.id === userId ? user : (await getUserProfile(userId)).user;
      const nextUser = { ...baseUser, streakDays: result.streakDays, activeDays: result.activeDays };
      persistUser(nextUser);
      return nextUser;
    } catch (err) {
      console.warn("Aviso al verificar racha:", err.message);
      return user;
    }
  };

  const clearUser = () => persistUser(null);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser: persistUser,
        loading,
        fetchUserProfile,
        checkStreak,
        addPoints,
        clearUser,
        pointsPulse,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
