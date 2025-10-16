import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import UserCard from "../component/UserCard";
import Loading from "../component/Loading";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { fetchUser } from "../features/user/userSlice";
import api from "../api/axios";

const Discover = () => {
  const dispatch = useDispatch();
  const [input, setInput] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();

  const handleSearch = async (e) => {
    if (e.key === "Enter" && input.trim() !== "") {
      try {
        setLoading(true);
        const token = await getToken();
        const { data } = await api.post(
          "/api/user/discover",
          { input },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data.success) {
          toast.success(data.message);
          setUsers(data.users);
        } else {
          setUsers([]);
          toast.error(data.message || "No users found");
        }
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong while fetching users");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    getToken().then((token) => dispatch(fetchUser(token)));
  }, [getToken, dispatch]);
  console.log("Discover loading:", loading, "users:", users);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Discover People
          </h1>
          <p className="text-slate-600">
            Connect with amazing people and grow your network
          </p>
        </div>

        {/* Search */}
        <div className="mb-8 shadow-md rounded-md border border-slate-200/60 bg-white/80">
          <div className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search people by name, username, bio, or location"
                className="pl-10 sm:pl-12 py-2 w-full border border-gray-300 rounded-md max-sm:text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                onChange={(e) => setInput(e.target.value)}
                value={input}
                onKeyUp={handleSearch}
              />
            </div>
          </div>
        </div>

        {/* Users list */}
        <div className="flex flex-wrap gap-6">
          {loading && <Loading height="60vh" />}
          {!loading && users.length === 0 && input.trim() !== "" && (
            <div className="text-slate-500 w-full text-center py-10">
              No users found.
            </div>
          )}
          {!loading &&
            users.map((user) => <UserCard user={user} key={user._id} />)}
        </div>
      </div>
    </div>
  );
};

export default Discover;
