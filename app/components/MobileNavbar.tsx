'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  Home,
  BookOpen,
  ClipboardList,
  ShoppingBag,
  Download,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: Home,          label: 'Home'        },
  { href: '/notes',     icon: BookOpen,      label: 'Notes'       },
  { href: '/projects',  icon: ClipboardList, label: 'Projects'    },
  { href: '/marketplace', icon: ShoppingBag, label: 'Market'      },
  { href: '/leaderboard', icon: Download,    label: 'More'        },
]

export function MobileNavbar() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(() => {
        const currentY = window.scrollY
        if (currentY <= 10) {
          setVisible(true)
        } else if (currentY > lastScrollY.current + 8) {
          setVisible(false)
        } else if (currentY < lastScrollY.current - 8) {
          setVisible(true)
        }
        lastScrollY.current = currentY
        ticking.current = false
      })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Hide public pages (onboarding, login, signup)
  const publicPaths = ['/', '/login', '/signup', '/forgot-password', '/reset-password']
  if (publicPaths.some(p => pathname === p)) return null


  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-6 pb-6 pointer-events-none lg:hidden"
      style={{
        transition: 'transform 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        transform: visible ? 'translateY(0)' : 'translateY(120px)',
      }}
    >
      <nav
        className="glass-navbar flex items-center justify-around px-3 pointer-events-auto"
        style={{
          height: 72,
          width: '100%',
          maxWidth: 420,
        }}
      >
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive =
            pathname === href ||
            (href !== '/dashboard' && pathname?.startsWith(href + '/'))
          return (
            <Link key={href} href={href} title={label}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: isActive ? '#1E2238' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 220ms ease',
                }}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  color={isActive ? '#FFFFFF' : '#8E90A6'}
                />
              </div>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
