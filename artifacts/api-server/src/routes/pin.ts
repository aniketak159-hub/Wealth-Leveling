import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/users/me/pin-status", requireAuth, (req, res): void => {
  const user = (req as any).dbUser;
  res.json({ hasPinSet: Boolean(user.pinHash) });
});

router.post("/auth/pin-verify", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).dbUser;

  if (!user.pinHash) {
    res.json({ success: true, noPinSet: true });
    return;
  }

  const pin = req.body?.pin;
  if (typeof pin !== "string" || !/^\d{4,6}$/.test(pin)) {
    res.status(400).json({ error: "PIN must be 4–6 digits." });
    return;
  }

  if (!(await bcrypt.compare(pin, user.pinHash))) {
    res.status(401).json({ error: "Incorrect PIN." });
    return;
  }

  res.json({ success: true });
});

export default router;