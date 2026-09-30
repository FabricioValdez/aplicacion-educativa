import { Router } from "express";
import { getUserAchievements } from "../db/achievement.repository.js";
import { requireUser } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireUser, async (request, response, next) => {
  try {
    const achievements = await getUserAchievements(request.user.id);
    return response.json({ achievements });
  } catch (error) {
    return next(error);
  }
});

export default router;
