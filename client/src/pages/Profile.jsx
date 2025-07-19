import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import {
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Edit,
  Trash2,
  Save,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";

const Profile = () => {
  const navigate = useNavigate();
  const {
    recruiterToken,
    recruiterData,
    setRecruiterAuth,
    logoutRecruiter,
    backendUrl,
  } = useContext(AppContext);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    organizationName: "",
    officeAddress: "",
    website: "",
    industry: "",
    organizationSize: "",
    logo: null,
  });

  const [profileData, setProfileData] = useState(null);

  // Fetch full recruiter profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!recruiterToken) return;

      try {
        const response = await axios.get(
          `${backendUrl}/api/recruiters/profile`,
          {
            headers: {
              Authorization: `Bearer ${recruiterToken}`,
            },
          }
        );

        if (response.data.success) {
          setProfileData(response.data.recruiter);
          console.log("Fetched profile data:", response.data.recruiter);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };

    fetchProfileData();
  }, [recruiterToken, backendUrl]);

  useEffect(() => {
    if (profileData) {
      setFormData({
        fullName: getDisplayName() || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
        organizationName: profileData.organizationName || "",
        officeAddress: profileData.officeAddress || "",
        website: profileData.website || "",
        industry: profileData.industry || "",
        organizationSize: profileData.organizationSize || "",
        logo: profileData.logo || null,
      });
    }
  }, [profileData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        logo: file,
      }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== "") {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await axios.put(
        `${backendUrl}/api/recruiters/profile`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${recruiterToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setRecruiterAuth(recruiterToken, response.data.recruiter);
        toast.success("Profile updated successfully!");
        setIsEditing(false);
      } else {
        toast.error(response.data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const response = await axios.delete(
        `${backendUrl}/api/recruiters/account`,
        {
          headers: {
            Authorization: `Bearer ${recruiterToken}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Account deleted successfully");
        logoutRecruiter();
        // Navigate to home page after account deletion
        navigate("/");
      } else {
        toast.error(response.data.message || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(error.response?.data?.message || "Failed to delete account");
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "R";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get the correct name field based on recruiter type
  const getDisplayName = () => {
    const data = profileData || recruiterData;
    console.log("Profile data:", data);
    console.log("Recruiter type:", data?.recruiterType);
    console.log("Full name:", data?.fullName);
    console.log("Contact person name:", data?.contactPersonName);

    if (data?.recruiterType === "Individual") {
      return data?.fullName;
    } else {
      return data?.contactPersonName;
    }
  };

  if (!profileData && !recruiterData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Profile Settings</h1>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Edit size={16} />
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save size={16} />
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture Section */}
          <div className="lg:col-span-1">
            <div className="text-center">
              <div className="relative inline-block">
                {profileData?.logo || recruiterData?.logo ? (
                  <img
                    src={profileData?.logo || recruiterData?.logo}
                    alt="Profile"
                    className="w-40 h-40 object-contain bg-white border-4 border-gray-200 rounded-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-700 text-white text-4xl font-bold flex items-center justify-center border-4 border-gray-200">
                    {getInitials(getDisplayName())}
                  </div>
                )}

                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-gray-700 text-white p-2 rounded-full cursor-pointer hover:bg-gray-800 transition-colors">
                    <Edit size={16} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {getDisplayName()}
                </h3>
                <p className="text-gray-600">
                  {profileData?.recruiterType || recruiterData?.recruiterType}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Details Section */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User size={20} />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{getDisplayName()}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-500" />
                      <p className="text-gray-900">
                        {profileData?.email || recruiterData?.email}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-gray-500" />
                        <p className="text-gray-900">
                          {profileData?.phone || recruiterData?.phone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Information */}
              {(profileData?.recruiterType || recruiterData?.recruiterType) !==
                "Individual" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Building size={20} />
                    Company Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Organization Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="organizationName"
                          value={formData.organizationName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">
                          {profileData?.organizationName ||
                            recruiterData?.organizationName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Office Address
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="officeAddress"
                          value={formData.officeAddress}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-transparent"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-gray-500" />
                          <p className="text-gray-900">
                            {profileData?.officeAddress ||
                              recruiterData?.officeAddress}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      {isEditing ? (
                        <input
                          type="url"
                          name="website"
                          value={formData.website}
                          onChange={handleInputChange}
                          placeholder="https://example.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">
                          {profileData?.website ||
                            recruiterData?.website ||
                            "Not provided"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Industry
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="industry"
                          value={formData.industry}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">
                          {profileData?.industry ||
                            recruiterData?.industry ||
                            "Not specified"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Organization Size
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="organizationSize"
                          value={formData.organizationSize}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">
                          {profileData?.organizationSize ||
                            recruiterData?.organizationSize ||
                            "Not specified"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Account Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Account Status
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        Verification Status
                      </p>
                      <p
                        className={`font-medium ${
                          recruiterData.isVerified
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {recruiterData.isVerified
                          ? "Verified"
                          : "Pending Verification"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Account Type</p>
                      <p className="font-medium text-gray-900">
                        {recruiterData.recruiterType}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
                  <AlertTriangle size={20} />
                  Danger Zone
                </h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700 mb-4">
                    Once you delete your account, there is no going back. Please
                    be certain.
                  </p>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 size={16} />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-red-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                Delete Account
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete your account? This action cannot
              be undone and will permanently remove all your data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Deleting..." : "Yes, Delete Account"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
