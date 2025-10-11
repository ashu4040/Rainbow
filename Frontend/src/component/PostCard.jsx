import { BadgeCheck, Heart, MessageCircle, Share2 } from "lucide-react";
import React, { useState } from "react";
import moment from "moment";
import { dummyUserData } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const PostCard = ({ post }) => {
  const navigate = useNavigate();
  const [likes, setLikes] = useState(post.likes || []);
  const currentUser = useSelector((state) => state.user.value);

  const handleLike = async () => {
    if (likes.includes(currentUser._id)) {
      setLikes(likes.filter((id) => id !== currentUser._id));
    } else {
      setLikes([...likes, currentUser._id]);
    }
  };

  const postWithHashtag = post.content
    ? post.content.replace(/(#\w+)/g, '<span class="text-pink-600">$1</span>')
    : "";

  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-4 w-full max-w-2xl">
      {/* user info */}
      <div
        onClick={() => navigate("/profile/" + post.user._id)}
        className="inline-flex items-center gap-3 cursor-pointer"
      >
        <img
          src={post.user.profile_picture}
          alt=""
          className="w-10 h-10 rounded-full shadow"
        />
        <div className="flex items-center space-x-1">
          <span>{post.user.full_name}</span>
          {post.user.is_verified && (
            <BadgeCheck className="w-4 h-4 text-blue-500" />
          )}
        </div>
        <div className="text-gray-500 text-sm">
          @{post.user.username} · {moment(post.createdAt).fromNow()}
        </div>
      </div>

      {/* content */}
      {post.content && (
        <div
          className="text-gray-800 text-sm whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: postWithHashtag }}
        />
      )}

      {/* images */}
      {post.image_urls?.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {post.image_urls.map((img, index) => (
            <img
              src={img}
              key={index}
              className={`w-full h-48 object-cover rounded-lg ${
                post.image_urls.length === 1 ? "col-span-2 h-auto" : ""
              }`}
              alt=""
            />
          ))}
        </div>
      )}

      {/* actions */}
      <div className="flex items-center gap-4 text-gray-600 text-sm pt-2 border-t border-gray-300">
        <div className="flex items-center gap-1">
          <Heart
            className={`w-4 h-4 cursor-pointer ${
              likes.includes(currentUser._id)
                ? "text-pink-500 fill-pink-500"
                : ""
            }`}
            onClick={handleLike}
          />
          <span>{likes.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle className="w-4 h-4 cursor-pointer" />
          <span>{12}</span>
        </div>
        <div className="flex items-center gap-1">
          <Share2 className="w-4 h-4 cursor-pointer" />
          <span>{7}</span>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
