import fs from "fs";
import User from "../models/User.js";
import imagekit from "../config/imagekit.js";
import connection from "../models/Connection.js";
import Post from "../models/post.js";
import { inngest } from "../inngest/index.js";

// ✅ Get user data using userId
export const getUserData = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ✅ Update user data
export const updateUserData = async (req, res) => {
  try {
    const { userId } = req.auth();
    let { username, bio, location, full_name } = req.body;

    const tempUser = await User.findById(userId);
    if (!tempUser) {
      return res.json({ success: false, message: "User not found" });
    }

    // Username check
    if (!username) username = tempUser.username;
    if (tempUser.username !== username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        username = tempUser.username; // username taken → keep old one
      }
    }

    const updatedData = { username, bio, location, full_name };

    const profile = req.files?.profile?.[0];
    const cover = req.files?.cover?.[0];

    // ✅ Upload profile picture
    if (profile) {
      const buffer = fs.readFileSync(profile.path);
      const uploadRes = await imagekit.upload({
        file: buffer,
        fileName: profile.originalname,
      });

      fs.unlinkSync(profile.path); // cleanup temp file

      const url = imagekit.url({
        path: uploadRes.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "512" },
        ],
      });

      updatedData.profile_picture = url;
    }

    // ✅ Upload cover photo
    if (cover) {
      const buffer = fs.readFileSync(cover.path);
      const uploadRes = await imagekit.upload({
        file: buffer,
        fileName: cover.originalname,
      });

      fs.unlinkSync(cover.path); // cleanup temp file

      const url = imagekit.url({
        path: uploadRes.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "1280" },
        ],
      });

      updatedData.cover_photo = url;
    }

    // ✅ Update user document
    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    });

    res.json({
      success: true,
      user: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ✅ Discover users
export const discoverUsers = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { input } = req.body;

    // Escape regex special characters
    const escapedInput = input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const allUsers = await User.find({
      $or: [
        { username: new RegExp(escapedInput, "i") },
        { email: new RegExp(escapedInput, "i") },
        { full_name: new RegExp(escapedInput, "i") },
        { location: new RegExp(escapedInput, "i") },
      ],
    });

    // Filter out current user
    const filteredUsers = allUsers.filter(
      (user) => user._id.toString() !== userId
    );

    res.json({ success: true, users: filteredUsers });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ✅ Follow user
export const followUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    if (userId === id) {
      return res.json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    const user = await User.findById(userId);
    const targetUser = await User.findById(id);

    if (!targetUser) {
      return res.json({ success: false, message: "Target user not found" });
    }

    if (user.following.includes(id)) {
      return res.json({
        success: false,
        message: "You are already following this user",
      });
    }

    user.following.push(id);
    await user.save();

    targetUser.followers.push(userId);
    await targetUser.save();

    res.json({ success: true, message: "Now you are following this user" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ✅ Unfollow user
export const UnfollowUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const user = await User.findById(userId);
    const targetUser = await User.findById(id);

    if (!targetUser) {
      return res.json({ success: false, message: "User not found" });
    }

    user.following = user.following.filter(
      (userIdFollow) => userIdFollow.toString() !== id
    );
    await user.save();

    targetUser.followers = targetUser.followers.filter(
      (followerId) => followerId.toString() !== userId
    );
    await targetUser.save();

    res.json({ success: true, message: "Unfollowed successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ✅ Send connection Request
export const sendConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    // check if user has sent more than 20 connection requests in the last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const connectionRequest = await connection.find({
      from_user_id: userId,
      created_at: { $gt: last24Hours },
    });
    if (connectionRequest.length >= 20) {
      return res.json({
        success: false,
        message:
          "You have sent more than 20 connection requests in the last 24 hours",
      });
    }

    // check if users are already connected
    const existingConnection = await connection.findOne({
      $or: [
        { from_user_id: userId, to_user_id: id },
        { from_user_id: id, to_user_id: userId },
      ],
    });

    if (!existingConnection) {
      const newConnection = await connection.create({
        from_user_id: userId,
        to_user_id: id,
      });

      await inngest.send({
        name: "app/connection-request",
        data: { connectionId: newConnection._id },
      });
      return res.json({
        success: true,
        message: "Connection request sent successfully",
      });
    } else if (existingConnection.status === "accepted") {
      return res.json({
        success: false,
        message: "You are already connected with this user",
      });
    }

    return res.json({
      success: false,
      message: "Connection request pending",
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ✅ Get user connections
export const getUserConnectiont = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId).populate(
      "connections followers following"
    );

    const userConnections = user.connections;
    const followers = user.followers;
    const following = user.following;

    const pendingConnections = (
      await connection
        .find({ to_user_id: userId, status: "pending" })
        .populate("from_user_id")
    ).map((conn) => conn.from_user_id);

    res.json({
      success: true,
      connections: userConnections,
      followers,
      following,
      pendingConnections,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ✅ Accept the connection request
export const acceptConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const existingConnection = await connection.findOne({
      from_user_id: id,
      to_user_id: userId,
    });

    if (!existingConnection) {
      return res.json({ success: false, message: "Connection not found" });
    }

    const user = await User.findById(userId);
    user.connections.push(id);
    await user.save();

    const toUser = await User.findById(id);
    toUser.connections.push(userId);
    await toUser.save();

    existingConnection.status = "accepted";
    await existingConnection.save();

    res.json({ success: true, message: "Connection accepted successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// get user profile
export const getUserProfile = async (req, res) => {
  try {
    const { profileId } = req.body;
    const profile = await User.findById(profileId);
    if (!profile) {
      return res.json({ success: false, message: "Profile not found" });
    }
    const posts = await Post.find({ user: profileId }).populate("user");
    res.json({ success: true, profile, posts });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
