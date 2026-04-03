"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("No token provided.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch("/api/contractor/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Verification failed");
        }

        setStatus("success");
        window.location.href = "/contractor/dashboard";
      } catch (err) {
        setStatus("error");
        setErrorMsg(
          err instanceof Error ? err.message : "Something went wrong"
        );
      }
    };

    verify();
  }, [token]);

  if (status === "loading") {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        <p className="text-sm text-gray-600">Verifying your login link...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-gray-900">
          Link expired or invalid
        </h1>
        <p className="mt-2 text-sm text-gray-600">{errorMsg}</p>
        <a
          href="/contractor/login"
          className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Request a new login link
        </a>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-sm text-gray-600">Redirecting...</p>
    </div>
  );
}

export default function ContractorVerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <Suspense
          fallback={
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
              <p className="text-sm text-gray-600">Loading...</p>
            </div>
          }
        >
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  );
}
