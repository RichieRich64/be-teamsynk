import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config/app.config";
import connectDatabase from "./config/database.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { HTTPSTATUS } from "./config/http.config";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";

import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import { jwtAuth } from "./middlewares/isAuthenticated.middleware";
import workspaceRoutes from "./routes/workspace.route";
import memberRoutes from "./routes/member.route";
import projectRoutes from "./routes/project.route";
import taskRoutes from "./routes/task.route";

const app = express();
const BASE_PATH = config.BASE_PATH;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: [config.FRONTEND_ORIGIN, "http://localhost:3000"],
    // origin:
    //   config.NODE_ENV === "production"
    //     ? config.FRONTEND_ORIGIN
    //     : [
    //         config.FRONTEND_ORIGIN,
    //         "http://localhost:3000",
    //         "http://localhost:3001",
    //       ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.get(
  `/`,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    return res.status(HTTPSTATUS.OK).json({
      message: "Health check positive!!",
    });
  })
);

app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/user`, jwtAuth, userRoutes);
app.use(`${BASE_PATH}/workspace`, jwtAuth, workspaceRoutes);
app.use(`${BASE_PATH}/member`, jwtAuth, memberRoutes);
app.use(`${BASE_PATH}/project`, jwtAuth, projectRoutes);
app.use(`${BASE_PATH}/task`, jwtAuth, taskRoutes);

app.use(errorHandler);

app.listen(config.PORT, async () => {
  console.log(
    `🚀 Server listening on port ${config.PORT} in ${config.NODE_ENV}`
  );
  await connectDatabase();
});
