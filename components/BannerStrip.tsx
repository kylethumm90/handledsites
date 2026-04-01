export default function BannerStrip({ message }: { message: string }) {
  return (
    <div className="w-full rounded-lg bg-card-surface px-4 py-2 text-center">
      <p className="text-xs font-medium text-card-muted">{message}</p>
    </div>
  );
}
