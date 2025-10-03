import fs from "fs";
import imagekit from "../config/imagekit.js";
import Message from "../models/message.js";
import { json } from "stream/consumers";

// create an empty object to store SS Event connections
const connection = {};

// controller fnc for the SE endpoint
export const sseController = (req, res) => {
  const { userId } = req.params;
  console.log("new client connected:", userId);

  // set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Add the client response object to the connections object
  connection[userId] = res;

  // send an initial event to the client
  res.write("log: Connected to SSE stream\n\n");

  // Handle client disconnection
  req.on("close", () => {
    // Remove the client response object from the connections array
    delete connection[userId];
    console.log("Client disconnected");
  });
};

// Send Message
export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id, text } = req.body;
    const image = req.file;
    let media_url = "";
    let message_type = image ? "image" : "text";

    if (message_type === "image") {
      const fileBuffer = fs.readFileSync(image.path);
      const response = await imagekit.upload({
        file: fileBuffer,
        fileName: image.originalname,
      });
      media_url = imagekit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "1280" },
        ],
      });
    }

    const message = await Message.create({
      from_user_id: userId,
      to_user_id,
      text,
      message_type,
      media_url,
    });

    res.json({ success: true, message });

    // send message to to_user-id using SSE

    const messageWithUserData = await Message.findById(message._id).populate(
      "from_user_id"
    );
    if (connection[to_user_id]) {
      connection[to_user_id].write(
        `data: ${JSON.stringify(messageWithUserData)}\n\n`
      );
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// get chat message
export const getChatMessage = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { to_user_id } = req.body;
    const messages = await Message.find({
      $or: [
        { from_user_id: userId, to_user_id },
        { from_user_id: to_user_id, userId },
      ],
    }).sort({ created_at: -1 });

    // mark messages as seen
    await Message.updateMany(
      { from_user_id: to_user_id, to_user_id: userId },
      { seen: true }
    );
    res.json({ success: true, messages });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getUserRecentMessages = async (res, req) => {
  try {
    const { userId } = req.auth();
    const messages = await Message.find(
      { to_user_id: userId }.populate("from_user_id to_user_id")
    ).sort({ created_at: -1 });
    res.json({ success: true, messages });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
