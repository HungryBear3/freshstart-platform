import Link from "next/link"

type LogoProps = {
  href?: string
  className?: string
  iconClassName?: string
  showIcon?: boolean
}

export function Logo({
  href = "/",
  className = "text-2xl font-bold text-blue-600",
  iconClassName = "from-violet-500 to-sky-400",
  showIcon = true,
}: LogoProps) {
  return (
    <Link href={href} className="flex items-center gap-3">
      {showIcon ? (
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${iconClassName} shadow-[0_10px_30px_rgba(99,102,241,0.45)]`}
          aria-hidden="true"
        >
          <span className="h-3 w-3 rounded-full bg-white/90" />
        </span>
      ) : null}
      <span className={className}>FreshStart IL</span>
    </Link>
  )
}
