import { buttonVariants } from '#/components/ui/button'
import { Icons } from '#/components/ui/icons'
import { cn } from '#/lib/utils'
import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const navItems = [
  { name: 'Features', href: '#features' },
  { name: 'Resume', href: '#resume' },
  { name: 'Cover Letter', href: '#cover-letter' },
  { name: 'Pricing', href: '#pricing' },
] as const

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMenuVisible, setIsMenuVisible] = useState(false)

  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMenuVisible(true)
      document.body.style.overflow = 'hidden'
    } else {
      const timer = setTimeout(() => {
        setIsMenuVisible(false)
        document.body.style.overflow = ''
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isMobileMenuOpen])

  return (
    <nav>
      <div className="container mx-auto px-4">
        <div className="flex h-[var(--header-height)] items-center justify-between">
          <Link to="/" className="flex gap-2 font-bold text-gray-800">
            <Icons.LogoWithText className="h-10 w-32" />
          </Link>

          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-md font-medium text-gray-800 hover:text-gray-900"
              >
                {item.name}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/signin"
              className={cn(buttonVariants({ variant: 'outline' }), 'h-12')}
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className={cn(buttonVariants({ variant: 'default' }), 'h-12')}
            >
              Get Started
            </Link>
          </div>

          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuVisible ? (
        <div
          className={cn(
            'fixed inset-0 z-50 h-full w-full bg-white',
            'transition-transform duration-300 ease-in-out',
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-20 items-center justify-between border-b border-gray-100 px-4">
            <Link
              to="/"
              className="flex gap-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Icons.LogoWithText className="h-8 w-28" />
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="h-[calc(100vh-80px)] overflow-y-auto">
            <div className="flex flex-col">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block border-b border-gray-100 px-4 py-4 text-lg text-gray-900 hover:text-gray-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white p-4 space-y-3">
            <Link
              to="/signin"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'w-full justify-center text-gray-700',
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className={cn(
                buttonVariants({ variant: 'default', size: 'lg' }),
                'w-full justify-center',
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      ) : null}
    </nav>
  )
}
