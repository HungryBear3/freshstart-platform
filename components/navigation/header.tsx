"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Menu, X, HelpCircle } from "lucide-react"
import { Logo } from "@/components/navigation/Logo"
import { HelpSidebar } from "@/components/help/help-sidebar"

type HeaderProps = {
  // When true, render the dark "home" premium shell regardless of the current
  // path. Used by the premium homepage preview route (/preview/premium-homepage),
  // which is not at "/" but still wants the home treatment. Defaults to the
  // existing pathname-based behavior so layout callers are unaffected.
  forceHomeVariant?: boolean
}

export function Header({ forceHomeVariant = false }: HeaderProps = {}) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const isHome = forceHomeVariant || pathname === "/"

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Legal Info", href: "/legal-info" },
    { name: "Pricing", href: "/pricing" },
    { name: "Contact", href: "/contact" },
    { name: "Dashboard", href: "/dashboard", auth: true },
  ]

  const checklistNav = { name: "Free Checklist", href: "/checklist" }

  const filteredNav = session
    ? navigation
    : navigation.filter((item) => !item.auth)

  return (
    <header
      className={isHome ? "bg-slate-950/95 border-b border-white/10 text-white" : "bg-white shadow-sm border-b border-gray-200"}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div
          className={isHome ? "flex w-full items-center justify-between py-4" : "flex w-full items-center justify-between border-b border-gray-200 py-4 lg:border-none"}
        >
          <div className="flex items-center">
            <Logo
              className={isHome ? "text-xl font-semibold text-white sm:text-2xl" : "text-2xl font-bold text-blue-600"}
              iconClassName={isHome ? "from-indigo-500 via-violet-500 to-sky-400" : "from-violet-500 to-sky-400"}
            />
          </div>

          <div className="hidden lg:flex lg:items-center lg:space-x-6">
            {filteredNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={
                  isHome
                    ? "text-sm font-medium text-slate-200 hover:text-white transition-colors"
                    : "text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                }
              >
                {item.name}
              </Link>
            ))}
            <Link
              href={checklistNav.href}
              className={
                isHome
                  ? "rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
                  : "text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50"
              }
            >
              {checklistNav.name}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHelpOpen(true)}
              aria-label="Open help"
              className={
                isHome
                  ? "text-slate-300 hover:bg-white/5 hover:text-white"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
            {session ? (
              <div className="flex items-center space-x-4">
                <Link href="/dashboard/profile">
                  <Button variant="ghost" size="sm" className={isHome ? "text-slate-100 hover:bg-white/5" : ""}>
                    Profile
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className={isHome ? "border-white/15 bg-white/5 text-white hover:bg-white/10" : ""}
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm" className={isHome ? "text-slate-100 hover:bg-white/5" : ""}>
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button
                    size="sm"
                    className={
                      isHome
                        ? "rounded-full bg-violet-500 px-4 text-white hover:bg-violet-400"
                        : ""
                    }
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              className={isHome ? "text-slate-100 hover:bg-white/5" : ""}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className={isHome ? "lg:hidden border-t border-white/10 py-4" : "lg:hidden border-t border-gray-200 py-4"}>
            <div className="space-y-4">
              {filteredNav.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={
                    isHome
                      ? "block text-base font-medium text-slate-100 hover:text-white transition-colors"
                      : "block text-base font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                href={checklistNav.href}
                className={
                  isHome
                    ? "block rounded-full bg-amber-300 px-4 py-3 text-base font-semibold text-slate-950"
                    : "block text-base font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                {isHome ? checklistNav.name : `${checklistNav.name} →`}
              </Link>
              <div className={isHome ? "pt-4 border-t border-white/10 space-y-2" : "pt-4 border-t border-gray-200 space-y-2"}>
                {session ? (
                  <>
                    <Link href="/dashboard/profile">
                      <Button
                        variant="ghost"
                        className={isHome ? "w-full justify-start text-slate-100 hover:bg-white/5" : "w-full justify-start"}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Profile
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className={isHome ? "w-full border-white/15 bg-white/5 text-white hover:bg-white/10" : "w-full"}
                      onClick={() => {
                        setMobileMenuOpen(false)
                        signOut({ callbackUrl: "/" })
                      }}
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/signin" className="block">
                      <Button
                        variant="ghost"
                        className={isHome ? "w-full text-slate-100 hover:bg-white/5" : "w-full"}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/signup" className="block">
                      <Button
                        className={
                          isHome
                            ? "w-full rounded-full bg-violet-500 text-white hover:bg-violet-400"
                            : "w-full"
                        }
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
      <HelpSidebar open={helpOpen} onClose={() => setHelpOpen(false)} />
    </header>
  )
}
