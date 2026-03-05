import { Router } from "express";
import { verifyCognito } from "../middleware/verifyCognito";
import { getUser, getUsers } from "../controllers/userController";

const router = Router();

// ✅ protected
router.get("/", verifyCognito, getUsers);
router.get("/:cognitoId", verifyCognito, getUser);

// ❌ recommend removing postUser in production (users come from auth)
// router.post("/", verifyCognito, postUser);

export default router;