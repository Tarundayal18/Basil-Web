"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { tenantUsersService } from "@/services/tenantUsers.service";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

/**
 * Accept Invitation Page
 * Handles invitation acceptance for both logged-in and new users
 */
function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "redirecting">("loading");
  const [message, setMessage] = useState("");

  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const phone = searchParams.get("phone");

  useEffect(() => {
    if (!token) return;
    const handleInvitation = async () => {
      try {
        if (isAuthenticated && user) {
          // User is already logged in - accept invitation directly
          try {
            await tenantUsersService.acceptInvitation({ invitationToken: token });
            setStatus("success");
            setMessage("Invitation accepted successfully! Redirecting to dashboard...");
            setTimeout(() => {
              router.push("/dashboard");
            }, 2000);
          } catch (error) {
            setStatus("error");
            setMessage(
              error instanceof Error
                ? error.message
                : "Failed to accept invitation. Please try again."
            );
          }
        } else {
          // User is not logged in - redirect to registration with token
          setStatus("redirecting");
          const registerUrl = email
            ? `/register?invitationToken=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
            : phone
            ? `/register?invitationToken=${encodeURIComponent(token)}&phone=${encodeURIComponent(phone)}`
            : `/register?invitationToken=${encodeURIComponent(token)}`;
          router.push(registerUrl);
        }
      } catch (_error) {
        setStatus("error");
        setMessage("An error occurred. Please try again.");
      }
    };

    handleInvitation();
  }, [email, isAuthenticated, phone, router, token, user]);

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invitation Error
          </h1>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-left">
            <p className="text-red-800 text-sm">
              Invalid invitation link. Missing invitation token.
            </p>
          </div>
          <button
            onClick={() => router.push("/login")}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (status === "redirecting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to registration...</p>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Processing invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
        {status === "success" ? (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Invitation Accepted!
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
          </>
        ) : (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Invitation Error
            </h1>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-left">
              <p className="text-red-800 text-sm">{message}</p>
            </div>
            <button
              onClick={() => router.push("/login")}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitation() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
