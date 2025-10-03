import express from "express";
import {
  getChatMessage,
  sendMessage,
  sseController,
} from "../controllers/messageController";
import { upload } from "../config/multer";

const messageRouter = express.Router();
messageRouter.get("/:userId", sseController);
messageRouter.post("/send", upload.single("image").protect, sendMessage);
messageRouter.post("/get", protect, getChatMessage);

export default messageRouter;
