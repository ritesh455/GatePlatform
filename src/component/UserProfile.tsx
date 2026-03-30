"use client";

import { useEffect, useState } from "react";
import { apiService } from "../services/api";

const UserProfile = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    const res = await apiService.getUserProfile();

    if (res.success && res.data) {
      setUser(res.data.user || res.data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-lg font-semibold">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-xl p-6 border border-slate-200">
        <h1 className="text-2xl font-bold mb-6 text-slate-800">
          User Profile
        </h1>

        <div className="space-y-4">

          <div className="flex justify-between border-b pb-2">
            <span className="font-semibold text-slate-600">User ID</span>
            <span>{user?.id}</span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span className="font-semibold text-slate-600">Email</span>
            <span>{user?.email}</span>
          </div>

          {user?.user_no && (
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold text-slate-600">User No</span>
              <span>{user?.user_no}</span>
            </div>
          )}

          {user?.branch && (
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold text-slate-600">Branch</span>
              <span>{user?.branch}</span>
            </div>
          )}

          {user?.role && (
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold text-slate-600">Role</span>
              <span className="capitalize">{user?.role}</span>
            </div>
          )}

          {user?.created_at && (
            <div className="flex justify-between">
              <span className="font-semibold text-slate-600">Joined</span>
              <span>
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;