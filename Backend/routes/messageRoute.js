import express from "express";
import {
  getChatMessage,
  sendMessage,
  sseController,
} from "../controllers/messageController.js";
import { upload } from "../config/multer.js";
import { protect } from "../middlewares/auth.js"; // make sure you import protect

const messageRouter = express.Router();

// SSE
messageRouter.get("/:userId", sseController);

// Send message with image upload
messageRouter.post("/send", protect, upload.single("image"), sendMessage);

// Get chat messages
messageRouter.post("/get", protect, getChatMessage);

export default messageRouter;
