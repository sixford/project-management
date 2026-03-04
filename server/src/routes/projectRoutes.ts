import { Router } from "express";
import { createProject, getProjects } from "../controllers/projectController";
import { verifyCognito } from "../middleware/verifyCognito";

const router = Router();

// ✅ protected
router.get("/", verifyCognito, getProjects);
router.post("/", verifyCognito, createProject);

export default router;