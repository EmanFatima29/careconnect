import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  getFriends,
  getFriendRequests,
  removeFriend,
} from "../controllers/friendController.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", getFriends);
router.get("/requests", getFriendRequests);
router.post("/request", sendFriendRequest);
router.post("/accept", acceptFriendRequest);
router.post("/decline", declineFriendRequest);
router.delete("/:friendId", removeFriend);

export default router;
