import { getUserFullDetails } from "../db/user.repository.js";

export const publicUser = ({ password, ...user }) => user;

export async function requireUser(request, response, next) {
  try {
    const userId = request.header("x-user-id");
    if (!userId) {
      return response.status(401).json({ message: "Sesión no válida. Falta identificador de usuario." });
    }

    const user = await getUserFullDetails(userId);
    if (!user) {
      return response.status(401).json({ message: "Sesión no válida." });
    }

    request.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}
