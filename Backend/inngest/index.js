// inngestFunctions.js
import { Inngest } from "inngest";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import connection from "../models/Connection.js";
import sendEmail from "../config/nodeMailer.js";
import Story from "../models/Story.js";
import Message from "../models/message.js";

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

// inngest function to send reminder when a new connection request is added
const sendNewConnectionRequestReminder = inngest.createFunction(
  { id: "send-new-connection-request-reminder" },
  { event: "app/connection-request" },
  async ({ event, step }) => {
    const { connectionId } = event.data;

    await step.run("send-connection-request-mail", async () => {
      const Connection = await connection
        .findById(connectionId)
        .populate("from_user_id to_user_id");
      const subject = "New Connection Request";
      const body = `<div style="font-family: Arial, sans-serif; padding: 20px;">
                  <h2>Hi ${connection.to_user_id.full_name},</h2>
                  <p>You have a new connection request from ${connection.from_user_id.full_name} @${connection.from_user_id.username}</p>
                  <p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color:#10b981;">here</a> to accept or reject the request</p>
                  <br/>
                  <p>Thanks, <br/>PingUp Stay Connected</p>
</div>`;

      await sendEmail({
        to: connection.to_user_id.email,
        subject,
        body,
      });
    });

    const in24hr = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await step.sleepUntil("wait for", in24hr);
    await step.run("send-connection-request-reminder", async () => {
      const Connection = await connection
        .findById(connectionId)
        .populate("from_user_id to_user_id");
      if (Connection.status === "accepted") {
        return { message: "Already Accepted" };
      }
      const subject = "New Connection Request";
      const body = `<div style="font-family: Arial, sans-serif; padding: 20px;">
                  <h2>Hi ${connection.to_user_id.full_name},</h2>
                  <p>You have a new connection request from ${connection.from_user_id.full_name} @${connection.from_user_id.username}</p>
                  <p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color:#10b981;">here</a> to accept or reject the request</p>
                  <br/>
                  <p>Thanks, <br/>Rainbow Stay Connected</p>
</div>`;
      await sendEmail({
        to: connection.to_user_id.email,
        subject,
        body,
      });
      return { message: "Reminder Sent" };
    });
  }
);

// Inngest fnc to delete story after 24 hours
const deleteStory = inngest.createFunction(
  { id: "story-delete" },
  { event: "app/story.delete" },
  async ({ event, step }) => {
    const { storyId } = event.data;
    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await step.sleepUntil("wait for 24 hours", in24Hours);
    await step.run("delete-story", async () => {
      await Story.findByIdAndDelete(storyId);
      return { message: "Story deleted" };
    });
  }
);

const sendNotificationOfUnseenMessages = inngest.createFunction(
  { id: "send-unseen-messages-notification" },
  { cron: "TZ=America/New_York 0 9 * * *" }, // everyday at 9 am
  async ({ step }) => {
    const messages = Message.find({ seen: false }.populate("to_user_id"));
    const unseenCount = {}(await messages).map((message) => {
      unseenCount[message.to_user_id._id] =
        (unseenCount[message.to_user_id._id] || 0) + 1;
    });

    for (const userId in unseenCount) {
      const user = await User.findById(userId);
      const subject = `You have ${unseenCount[userId]} unseen messages`;
      const body = `
 <div style="font-family: Arial, sans-serif; padding: 20px;">
                  <h2>Hi ${connection.to_user_id.full_name},</h2>
                  <p>You have a new connection request from ${connection.from_user_id.full_name} @${connection.from_user_id.username}</p>
                  <p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color:#10b981;">here</a> to accept or reject the request</p>
                  <br/>
                  <p>Thanks, <br/>Rainbow Stay Connected</p>
</div>
 `;

      await sendEmail({
        to: user.email,
        subject,
        body,
      });
    }
    return { message: "Notification sent." };
  }
);

// ✅ Export all functions
export const functions = [
  syncUserCreation,
  syncUserUpdation,
  syncUserDeletion,
  sendNewConnectionRequestReminder,
  deleteStory,
  sendNotificationOfUnseenMessages,
];
