import { Router } from "express";
import { getLeaderboard } from "../db/leaderboard.repository.js";
import { requireUser } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/leaderboard", requireUser, async (request, response, next) => {
  try {
    const classId = request.query.classId || request.header("x-class-id") || null;
    const data = await getLeaderboard(request.user.id, classId);
    return response.json(data);
  } catch (error) {
    return next(error);
  }
});

export default router;
