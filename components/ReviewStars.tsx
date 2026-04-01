import { Star } from "lucide-react";

type Props = {
  reviewCount: number | null;
  avgRating: number | null;
};

export default function ReviewStars({ reviewCount, avgRating }: Props) {
  if (!reviewCount || !avgRating) return null;

  const fullStars = Math.floor(avgRating);
  const hasHalf = avgRating - fullStars >= 0.5;

  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl bg-card-surface px-4 py-3">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < fullStars
                ? "fill-yellow-400 text-yellow-400"
                : i === fullStars && hasHalf
                  ? "fill-yellow-400/50 text-yellow-400"
                  : "text-gray-600"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-card-muted">
        {avgRating.toFixed(1)} · {reviewCount} Google reviews
      </p>
    </div>
  );
}
