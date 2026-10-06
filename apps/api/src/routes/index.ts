import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import portfolioRouter from "./portfolio";
import testimonialsRouter from "./testimonials";
import contactRouter from "./contact";
import adminRouter from "./admin";
import servicesRouter from "./services";
import homepageRouter from "./homepage";
import recentlyDeletedRouter from "./recentlyDeleted";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(portfolioRouter);
router.use(testimonialsRouter);
router.use(contactRouter);
router.use(adminRouter);
router.use(servicesRouter);
router.use(homepageRouter);
router.use(recentlyDeletedRouter);

export default router;
