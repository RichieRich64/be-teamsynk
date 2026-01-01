import { Router } from "express";
import {
  loginController,
  logOutController,
  refreshTokenController,
  registerUserController,
} from "../controllers/auth.controller";

const authRoutes = Router();

authRoutes.post("/register", registerUserController);
authRoutes.post("/login", loginController);

authRoutes.post("/refresh-token", refreshTokenController);

authRoutes.post("/logout", logOutController);

export default authRoutes;
