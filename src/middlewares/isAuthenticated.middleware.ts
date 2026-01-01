import jwt from "jsonwebtoken";
import { config } from "../config/app.config";
import UserModel from "../models/user.model";
import { refreshAccessToken } from "../services/auth.service";
import { UnauthorizedException } from "../utils/appError";
import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "./asyncHandler.middleware";

export const jwtAuth = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      throw new UnauthorizedException("Access token required");
    }

    try {
      const decoded = jwt.verify(accessToken, config.JWT_ACCESS_SECRET) as any;
      const user = await UserModel.findById(decoded.userId);

      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      req.user = user as any;
      next();
    } catch (error) {
      // Try refresh token if access token expired
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        throw new UnauthorizedException("Authentication required");
      }

      try {
        const tokens = await refreshAccessToken(refreshToken);

        // Set new cookies
        res.cookie("accessToken", tokens.accessToken, {
          httpOnly: true,
          secure: config.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 15 * 60 * 1000,
        });

        res.cookie("refreshToken", tokens.refreshToken, {
          httpOnly: true,
          secure: config.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        const decoded = jwt.verify(
          tokens.accessToken,
          config.JWT_ACCESS_SECRET
        ) as any;
        const user = await UserModel.findById(decoded.userId);
        if (!user) {
          throw new UnauthorizedException("User not found");
        }
        req.user = user as any;
        next();
      } catch (refreshError) {
        throw new UnauthorizedException("Authentication failed");
      }
    }
  }
);
