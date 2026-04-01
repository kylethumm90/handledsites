export default function BannerStrip({ message }: { message: string }) {
  return (
    <div
      className="w-full rounded-lg px-4 py-2 text-center"
      style={{ backgroundColor: "#1a1e2e" }}
    >
      <p style={{ color: "#e2e8f0", fontSize: "13px", fontWeight: 500 }}>
        {message}
      </p>
    </div>
  );
}
