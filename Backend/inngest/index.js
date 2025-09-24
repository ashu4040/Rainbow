// inngestFunctions.js
import { Inngest } from "inngest";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";

// ✅ Create Inngest client
export const inngest = new Inngest({ id: "rainbow-app" });

// ✅ Ensure DB is connected before running any functions
if (mongoose.connection.readyState === 0) {
  await connectDB();
}

/**
 * 🟢 Handle Clerk User Creation
 */
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    try {
      await connectDB();

      console.log("📩 Clerk Event Data:", event.data);

      const { id, first_name, last_name, email_addresses, image_url } =
        event.data;

      // ✅ Safely get email
      const email =
        email_addresses && email_addresses.length > 0
          ? email_addresses[0].email_address
          : null;

      if (!email) {
        console.error("❌ No email found for Clerk user:", event.data);
        return;
      }

      // ✅ Generate username
      let username = email.split("@")[0];
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        username = username + Math.floor(Math.random() * 10000);
      }

      const userData = {
        _id: id,
        email,
        full_name: `${first_name || ""} ${last_name || ""}`.trim(),
        profile_picture: image_url || "",
        username,
      };

      console.log("📝 Saving user:", userData);

      const savedUser = await User.create(userData);

      console.log("✅ User saved in DB:", savedUser);
    } catch (err) {
      console.error("❌ Error in syncUserCreation:", err.message);
    }
  }
);

/**
 * 🟡 Handle Clerk User Update
 */
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    try {
      await connectDB();

      const { id, first_name, last_name, email_addresses, image_url } =
        event.data;

      const email = email_addresses?.[0]?.email_address || null;

      const updateUserData = {
        ...(email && { email }),
        full_name: `${first_name || ""} ${last_name || ""}`.trim(),
        profile_picture: image_url || "",
      };

      const updatedUser = await User.findByIdAndUpdate(id, updateUserData, {
        new: true,
      });

      console.log("✅ User updated:", updatedUser);
    } catch (err) {
      console.error("❌ Error updating user:", err.message);
    }
  }
);

/**
 * 🔴 Handle Clerk User Deletion
 */
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    try {
      await connectDB();

      const { id } = event.data;
      await User.findByIdAndDelete(id);

      console.log("✅ User deleted:", id);
    } catch (err) {
      console.error("❌ Error deleting user:", err.message);
    }
  }
);

// ✅ Export all functions
export const functions = [syncUserCreation, syncUserUpdation, syncUserDeletion];
