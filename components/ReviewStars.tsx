import { Star } from "lucide-react";

type Props = {
  reviewCount: number | null;
  avgRating: number | null;
};

export default function ReviewStars({ reviewCount, avgRating }: Props) {
  if (!reviewCount || !avgRating) return null;

  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl bg-card-surface px-4 py-3">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => {
          const fill = Math.min(1, Math.max(0, avgRating - i));
          return (
            <div key={i} className="relative h-4 w-4">
              {/* Empty star (background) */}
              <Star className="absolute inset-0 h-4 w-4 text-gray-600" />
              {/* Filled star (clipped) */}
              {fill > 0 && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-card-muted">
        {avgRating.toFixed(1)} · {reviewCount} Google reviews
      </p>
    </div>
  );
}
