import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createGroup,
  getGroupByName,
  getGroupById,
  getAllGroups,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  leaveGroup,
  addGroupToHistory,
} from "../controllers/groupController.js";

const router = express.Router();

router.use(requireAuth);

// Specific routes before generic/parameterized routes
router.post("/", createGroup);
router.post("/exit", leaveGroup);
router.post("/addGroupToHistory", addGroupToHistory);
router.get("/", getAllGroups);
router.get("/name/:name", getGroupByName);

// Group-specific operations
router.get("/:groupId", getGroupById);
router.patch("/:groupId", updateGroup);
router.delete("/:groupId", deleteGroup);

// Member management
router.post("/:groupId/members", addMember);
router.delete("/:groupId/members/:memberId", removeMember);

export default router;
