// server/src/index.ts
import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

/* ROUTE IMPORTS */
import projectRoutes from "./routes/projectRoutes";
import taskRoutes from "./routes/taskRoutes";
import searchRoutes from "./routes/searchRoutes";
import userRoutes from "./routes/userRoutes";
import teamRoutes from "./routes/teamRoutes";
import authRouter from "./routes/auth";
import { verifyCognito } from "./middleware/verifyCognito";

/* CONFIGURATIONS */
dotenv.config();
const app = express();

app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);

/* ROUTES */
app.get("/", (_req, res) => {
  res.send("This is home route");
});

// Handy “is the server up?” route (no auth)
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

// ✅ auth routes first is fine (these must be public)
app.use("/auth", authRouter);

// ✅ protect everything else that serves app data
app.use("/projects", verifyCognito, projectRoutes);
app.use("/tasks", verifyCognito, taskRoutes);
app.use("/search", verifyCognito, searchRoutes);
app.use("/users", verifyCognito, userRoutes);
app.use("/teams", verifyCognito, teamRoutes);

/* SERVER */
const port = Number(process.env.PORT) || 5001;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});