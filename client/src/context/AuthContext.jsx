import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";

const AuthContext = createContext();

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut } = useClerkAuth();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userLoaded) {
      if (user) {
        // Transform Clerk user data to match your app's user structure
        const transformedUser = {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          imageUrl: user.imageUrl,
          createdAt: user.createdAt,
          // Add any additional fields you need
          phone: user.phoneNumbers?.[0]?.phoneNumber,
          location: user.publicMetadata?.location,
          userType: user.publicMetadata?.userType || "jobseeker",
          // You can add more fields from user.publicMetadata
        };

        setUserData(transformedUser);
      } else {
        setUserData(null);
      }
      setIsLoading(false);
    }
  }, [user, userLoaded]);

  const logout = async () => {
    try {
      await signOut();
      setUserData(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      // Update Clerk user metadata
      await user.update({
        publicMetadata: {
          ...user.publicMetadata,
          ...updates,
        },
      });

      // Update local state
      setUserData((prev) => ({
        ...prev,
        ...updates,
      }));

      return true;
    } catch (error) {
      console.error("Profile update error:", error);
      return false;
    }
  };

  const value = {
    user: userData,
    isAuthenticated: !!user,
    isLoading: isLoading || !userLoaded,
    logout,
    updateUserProfile,
    // Clerk user object for advanced operations
    clerkUser: user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
