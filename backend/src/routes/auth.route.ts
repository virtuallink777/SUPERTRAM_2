import { Router } from "express";
import {
  logoutHandler,
  refreshHandler,
  registerHandler,
  verifyEmailHandler,
} from "../controllers/auth.controller";
import { loginHandler } from "../controllers/auth.controller";

const authRoutes = Router();

authRoutes.post("/register", registerHandler);
authRoutes.post("/login", loginHandler);
authRoutes.get("/refresh", refreshHandler);
authRoutes.get("/logout", logoutHandler);
authRoutes.get("/email/verify/:code", verifyEmailHandler);

export default authRoutes;
