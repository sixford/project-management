import { Router } from "express";
import { verifyCognito } from "../middleware/verifyCognito";
import { createTask, getTasks, getUserTasks, updateTaskStatus } from "../controllers/taskController";

const router = Router();

router.get("/", verifyCognito, getTasks);
router.post("/", verifyCognito, createTask);
router.patch("/:taskId/status", verifyCognito, updateTaskStatus);
router.get("/user/:userId", verifyCognito, getUserTasks);

export default router;