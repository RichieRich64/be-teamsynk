import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
// import { config } from "../config/app.config";
import { registerSchema } from "../validation/auth.validation";
import { HTTPSTATUS } from "../config/http.config";
import {
  generateTokenPair,
  refreshAccessToken,
  registerUserService,
  verifyUserService,
} from "../services/auth.service";
import { config } from "../config/app.config";
import RefreshTokenModel from "../models/refresh-token.model";
import { UnauthorizedException } from "../utils/appError";

// export const googleLoginCallback = asyncHandler(
//   async (req: Request, res: Response) => {
//     const currentWorkspace = req.user?.currentWorkspace;

//     if (!currentWorkspace) {
//       return res.redirect(
//         `${config.FRONTEND_GOOGLE_CALLBACK_URL}?status=failure`
//       );
//     }

//     return res.redirect(
//       `${config.FRONTEND_ORIGIN}/workspace/${currentWorkspace}`
//     );
//   }
// );

export const registerUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = registerSchema.parse({
      ...req.body,
    });

    await registerUserService(body);

    return res.status(HTTPSTATUS.CREATED).json({
      message: "User created successfully",
    });
  }
);

export const loginController = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    console.log("Login request from origin:", req.headers.origin);
    console.log("NODE_ENV:", config.NODE_ENV);
    console.log("FRONTEND_ORIGIN:", config.FRONTEND_ORIGIN);

    const user = await verifyUserService({ email, password });
    const { accessToken, refreshToken } = await generateTokenPair(
      user._id.toString()
    );

    // Set httpOnly cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: config.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: config.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    console.log("Cookies set:", {
      accessToken: !!accessToken,
      refreshToken: !!refreshToken,
    });

    console.log("Response headers:", res.getHeaders());

    return res.status(HTTPSTATUS.OK).json({
      message: "Logged in successfully",
      user,
    });
  }
);

export const refreshTokenController = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token required");
    }

    try {
      const newTokens = await refreshAccessToken(refreshToken);

      // Set new cookies
      res.cookie("accessToken", newTokens.accessToken, {
        httpOnly: true,
        secure: config.NODE_ENV === "production",
        sameSite: config.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", newTokens.refreshToken, {
        httpOnly: true,
        secure: config.NODE_ENV === "production",
        sameSite: config.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      return res.status(HTTPSTATUS.OK).json({
        message: "Tokens refreshed successfully",
      });
    } catch (error) {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }
);

export const logOutController = asyncHandler(
  async (req: Request, res: Response) => {
    // Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Remove refresh token from database (invalidate it)
      try {
        await RefreshTokenModel.deleteOne({ token: refreshToken });
      } catch (error) {
        console.error("Error removing refresh token:", error);
        // Continue with logout even if DB operation fails
      }
    }

    // Clear both cookies
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: config.NODE_ENV === "production" ? "none" : "lax",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: config.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "Logged out successfully",
    });
  }
);
