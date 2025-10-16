import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: { type: String, ref: "User", required: true },
    content: { type: String },
    image_urls: [{ type: String }], // ✅ this must exist
    post_type: {
      type: String,
      enum: ["text", "image", "text_with_image"],
      required: true,
    },
    likes_count: [{ type: String, ref: "User" }],
    view_count: [{ type: String }], // ✅ add this if not already there
  },
  { timestamps: true, minimize: false }
);

// 🧹 Force delete old compiled model (important!)
mongoose.models = {};

const Post = mongoose.model("Post", postSchema);

export default Post;
