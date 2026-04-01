"use client";

export default function LogoutButton() {
  return (
    <button
      className="text-xs text-gray-500 hover:text-gray-700"
      onClick={() => {
        fetch("/api/contractor/logout", { method: "POST" }).then(() => {
          window.location.href = "/contractor/login";
        });
      }}
    >
      Sign out
    </button>
  );
}
