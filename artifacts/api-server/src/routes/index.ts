import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bankRouter from "./bank";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bankRouter);

export default router;
