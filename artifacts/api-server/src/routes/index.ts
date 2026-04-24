import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import portfolioRouter from "./portfolio";
import testimonialsRouter from "./testimonials";
import contactRouter from "./contact";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(portfolioRouter);
router.use(testimonialsRouter);
router.use(contactRouter);
router.use(adminRouter);

export default router;
