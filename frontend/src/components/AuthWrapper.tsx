"use client";

import { useState, useEffect, createContext, useContext } from "react";
import LoginButton from "./LoginButton";
import toast, { Toaster } from "react-hot-toast";

interface User {
  email: string;
  name?: string;
  avatar_url?: string;
}

interface UserContextType {
  user: User | null;
  logout: () => void;
  refreshUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth?action=me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
        // Show error toast for authentication issues
        if (res.status === 401) {
          toast.error("Please sign in to continue");
        } else if (res.status === 500) {
          toast.error("Authentication service unavailable. Please try again.");
        }
      }
    } catch (error) {
      setUser(null);
      console.error("Authentication error:", error);
      toast.error(
        "Failed to check authentication status. Please refresh the page."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "logout" }),
      });

      if (res.ok) {
        setUser(null);
        toast.success("Logged out successfully");
        // Clear any cached data
        window.location.reload();
      } else {
        toast.error("Failed to logout. Please try again.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout. Please try again.");
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-900 items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <span className="text-white text-2xl">AI</span>
          </div>
          <div className="text-gray-300 text-lg font-medium">Loading...</div>
          <div className="text-gray-500 text-sm">Checking authentication</div>
        </div>
        <Toaster position="top-right" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen bg-gray-900 items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
            <span className="text-white text-3xl">AI</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-100 mb-2">
              Welcome to AI Assistant
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              Please sign in to access your personalized AI assistant. Your
              documents, chat history, and settings will be saved securely.
            </p>
          </div>
          <div className="space-y-3">
            <LoginButton />
            <p className="text-xs text-gray-500">
              Sign in with Google to get started
            </p>
          </div>
        </div>
        <Toaster position="top-right" />
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ user, logout, refreshUser: checkAuth }}>
      {children}
      <Toaster position="top-right" />
    </UserContext.Provider>
  );
}
