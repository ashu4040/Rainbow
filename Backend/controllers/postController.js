import fs from "fs";
import imagekit from "../config/imagekit.js";
import Post from "../models/post.js";
import User from "../models/User.js";

// Add Post
export const addPost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { content, post_type } = req.body;
    const images = req.files || [];
    let image_urls = [];

    if (images.length) {
      image_urls = await Promise.all(
        images.map(async (img) => {
          const fileBuffer = fs.readFileSync(img.path);
          const uploadRes = await imagekit.upload({
            file: fileBuffer,
            fileName: img.originalname,
            folder: "Posts",
          });

          fs.unlinkSync(img.path);

          return imagekit.url({
            path: uploadRes.filePath,
            transformation: [
              { quality: "auto" },
              { format: "webp" },
              { width: "1280" },
            ],
          });
        })
      );
    }

    await Post.create({ user: userId, content, image_urls, post_type });
    res.json({ success: true, message: "Post created successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get Posts
export const getPost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId);

    const userIds = [userId, ...user.connections, ...user.following];
    const posts = await Post.find({ user: { $in: userIds } })
      .populate("user")
      .sort({ createdAt: -1 });

    res.json({ success: true, posts });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Like Post
export const likePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.json({ success: false, message: "Post not found" });

    if (post.likes_count.includes(userId)) {
      post.likes_count = post.likes_count.filter((id) => id !== userId);
      await post.save();
      return res.json({ success: true, message: "Post Unliked", post });
    } else {
      post.likes_count.push(userId);
      await post.save();
      return res.json({ success: true, message: "Post liked", post });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
