"use client";
import { useState } from "react";
import toast from "react-hot-toast";

export default function LoginButton() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth?action=login-url", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (data.auth_url) {
        window.location.href = data.auth_url;
      } else {
        throw new Error("No authentication URL received");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to start login process. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium cursor-pointer"
    >
      {loading ? "Connecting..." : "Continue with Google"}
    </button>
  );
}
