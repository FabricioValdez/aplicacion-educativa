import { Router } from "express";
import { findUserForLogin, registerUser } from "../db/user.repository.js";
import { publicUser } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", async (request, response, next) => {
  try {
    const { name, password, role = "child", avatar } = request.body ?? {};

    if (!name || !password) {
      return response.status(400).json({ message: "Nombre y clave son requeridos." });
    }

    const newUser = await registerUser({ name, password, role, avatar });
    return response.status(201).json({ success: true, user: publicUser(newUser), token: newUser.id });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (request, response, next) => {

  try {
    const { name, password, role = "child" } = request.body ?? {};

    if (!name || !password) {
      return response.status(400).json({ success: false, message: "Nombre y clave son requeridos." });
    }

    const user = await findUserForLogin(name, password, role);

    if (!user) {
      return response.status(401).json({ success: false, message: "Nombre, clave o perfil incorrectos." });
    }

    return response.json({ success: true, user: publicUser(user), token: user.id });
  } catch (error) {
    return next(error);
  }
});

router.post("/logout", (_request, response) => {
  response.json({ message: "Sesión cerrada exitosamente" });
});

export default router;
