import Link from "next/link"

type LogoProps = {
  href?: string
  className?: string
}

export function Logo({ href = "/", className = "text-2xl font-bold text-blue-600" }: LogoProps) {
  const content = <span className={className}>FreshStart IL</span>
  return (
    <Link href={href} className="flex items-center">
      {content}
    </Link>
  )
}
