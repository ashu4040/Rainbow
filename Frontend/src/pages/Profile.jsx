import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Loading from "../component/Loading";
import { useAuth } from "@clerk/clerk-react";
import UserProfileInfo from "../component/UserProfileInfo";
import PostCard from "../component/PostCard";
import moment from "moment";
import ProfileModal from "../component/ProfileModal";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import api from "../api/axios";

const Profile = () => {
  const { profileId } = useParams();
  const { getToken } = useAuth();
  const currentUser = useSelector((state) => state.user.value);

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTabs] = useState("posts");
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUser = async (idToFetch) => {
    try {
      const token = await getToken();
      const { data } = await api.get("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
        params: { profileId: idToFetch },
      });

      if (data.success) {
        setUser(data.user);
        setPosts(data.posts);
      } else {
        toast.error(data.message || "Failed to load user profile");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser?._id) return;

    // ✅ Always use profileId from URL (not currentUser) unless URL is empty
    const idToFetch = profileId || currentUser._id;

    setLoading(true);
    fetchUser(idToFetch);
  }, [profileId, currentUser, getToken]);

  if (loading) return <Loading />;
  if (!user)
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        User not found
      </div>
    );

  return (
    <div className="relative h-full overflow-y-scroll bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="h-40 md:h-56 bg-gradient-to-r from-red-200 via-yellow-200 to-purple-200">
            {user.cover_photo && (
              <img
                className="w-full h-full object-cover"
                src={user.cover_photo}
                alt="cover"
              />
            )}
          </div>

          <UserProfileInfo
            user={user}
            post={posts}
            profileId={profileId}
            setShowEdit={setShowEdit}
          />
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <div className="bg-white rounded-xl shadow p-1 flex max-w-md mx-auto">
            {["posts", "media", "likes"].map((tab) => (
              <button
                key={tab}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === tab
                    ? "bg-pink-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setActiveTabs(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === "posts" && (
            <div className="mt-6 flex flex-col items-center gap-6">
              {posts.length > 0 ? (
                posts.map((post) => <PostCard key={post._id} post={post} />)
              ) : (
                <p className="text-gray-500 mt-6">No posts yet</p>
              )}
            </div>
          )}

          {activeTab === "media" && (
            <div className="flex flex-wrap mt-6 max-w-6xl gap-4 justify-center">
              {posts
                .filter((post) => post.image_urls?.length > 0)
                .flatMap((post) =>
                  post.image_urls.map((image, index) => (
                    <Link
                      target="_blank"
                      to={image}
                      key={index}
                      className="relative group"
                    >
                      <img
                        src={image}
                        alt=""
                        className="w-64 aspect-video object-cover rounded-lg shadow"
                      />
                      <p className="absolute bottom-0 right-0 text-xs p-1 px-3 backdrop-blur-xl text-white opacity-0 group-hover:opacity-100 transition duration-300">
                        Posted {moment(post.createdAt).fromNow()}
                      </p>
                    </Link>
                  ))
                )}
            </div>
          )}
        </div>
      </div>

      {showEdit && <ProfileModal setShowEdit={setShowEdit} />}
    </div>
  );
};

export default Profile;
