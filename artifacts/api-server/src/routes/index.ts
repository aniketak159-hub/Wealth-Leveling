import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import dashboardRouter from "./dashboard";
import questsRouter from "./quests";
import skillsRouter from "./skills";
import buildsRouter from "./builds";
import budgetRouter from "./budget";
import wealthRouter from "./wealth";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(dashboardRouter);
router.use(questsRouter);
router.use(skillsRouter);
router.use(buildsRouter);
router.use(budgetRouter);
router.use(wealthRouter);
router.use(adminRouter);

export default router;
