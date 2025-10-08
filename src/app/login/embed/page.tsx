"use client";
import React, { useEffect } from "react";
import { SignIn, useUser } from "@clerk/nextjs";

export default function LoginEmbed() {
  const { isSignedIn } = useUser();

  // When user signs in inside the iframe, notify the parent window so it can close the modal
  useEffect(() => {
    if (isSignedIn && typeof window !== "undefined" && window.parent) {
      // Immediately notify parent to close modal and redirect
      try {
        window.parent.postMessage({ type: "clerk:signed_in" }, window.location.origin);
        // Prevent any potential Clerk redirects within iframe
        window.stop?.();
      } catch {
        // ignore
      }
    }
  }, [isSignedIn]);

  // Additional check for successful authentication via URL changes
  useEffect(() => {
    const checkForSuccess = () => {
      if (typeof window !== "undefined" && window.parent && 
          (window.location.pathname.includes('sign-in') || window.location.search.includes('sign_in'))) {
        try {
          window.parent.postMessage({ type: "clerk:signed_in" }, window.location.origin);
        } catch {
          // ignore
        }
      }
    };
    
    // Check immediately and on any navigation
    checkForSuccess();
    const interval = setInterval(checkForSuccess, 100);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-6">
        <SignIn 
          path="/login/embed" 
          routing="path" 
          redirectUrl="/login/embed"
          forceRedirectUrl="/login/embed"
        />
      </div>
    </div>
  );
}
