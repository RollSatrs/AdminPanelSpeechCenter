import { FaRegStar, FaStar, FaStarHalfAlt } from "react-icons/fa"

import { cn } from "@/lib/utils"

type StarsRatingProps = {
  rating?: number
  className?: string
  starClassName?: string
}

export function StarsRating({
  rating = 5,
  className,
  starClassName,
}: StarsRatingProps) {
  return (
    <div
      className={cn("flex items-center gap-1 text-[#FF7A59]", className)}
      aria-label={`Рейтинг ${rating} из 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        if (rating >= star) {
          return <FaStar key={star} className={cn("h-5 w-5", starClassName)} />
        }

        if (rating >= star - 0.5) {
          return <FaStarHalfAlt key={star} className={cn("h-5 w-5", starClassName)} />
        }

        return (
          <FaRegStar
            key={star}
            className={cn("h-5 w-5 text-[#D9D9D9]", starClassName)}
          />
        )
      })}
    </div>
  )
}
