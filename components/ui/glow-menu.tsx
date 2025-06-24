"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface MenuItem {
  icon?: React.ElementType
  label: string
  href: string
  gradient?: string
  iconColor?: string
}

interface MenuBarProps {
  items: MenuItem[]
  activeItem: string
  onItemClick: (label: string) => void
  className?: string
}

export function MenuBar({ items, activeItem, onItemClick, className }: MenuBarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [itemPositions, setItemPositions] = useState<Record<string, { left: number; width: number }>>({})
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updatePositions = () => {
      if (!menuRef.current) return
      const positions: Record<string, { left: number; width: number }> = {}
      const menuRect = menuRef.current.getBoundingClientRect()
      
      items.forEach((item) => {
        const element = menuRef.current?.querySelector(`[data-label="${item.label}"]`) as HTMLElement
        if (element) {
          const rect = element.getBoundingClientRect()
          positions[item.label] = {
            left: rect.left - menuRect.left,
            width: rect.width,
          }
        }
      })
      
      setItemPositions(positions)
    }

    updatePositions()
    window.addEventListener("resize", updatePositions)
    return () => window.removeEventListener("resize", updatePositions)
  }, [items])

  const currentItem = hoveredItem || activeItem
  const currentPosition = itemPositions[currentItem]
  const currentMenuItem = items.find((item) => item.label === currentItem)

  return (
    <div
      ref={menuRef}
      className={cn(
        "relative inline-flex items-center gap-1 rounded-full bg-slate-800/60 backdrop-blur-xl p-1 shadow-lg border border-slate-700/50",
        className
      )}
    >
      {/* Background glow effect */}
      <AnimatePresence>
        {currentPosition && currentMenuItem && (
          <motion.div
            className="absolute top-0 h-full rounded-full"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              left: currentPosition.left,
              width: currentPosition.width,
            }}
            exit={{ opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
            }}
            style={{
              background: currentMenuItem.gradient,
              filter: "blur(8px)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Active indicator */}
      <AnimatePresence>
        {currentPosition && activeItem === currentItem && (
          <motion.div
            className="absolute top-0 h-full rounded-full bg-white/10 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              left: currentPosition.left,
              width: currentPosition.width,
            }}
            exit={{ opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
            }}
          />
        )}
      </AnimatePresence>

      {/* Menu items */}
      {items.map((item) => {
        const Icon = item.icon
        const isActive = activeItem === item.label
        const isHovered = hoveredItem === item.label

        return (
          <Link
            key={item.label}
            href={item.href}
            data-label={item.label}
            onClick={() => onItemClick(item.label)}
            onMouseEnter={() => setHoveredItem(item.label)}
            onMouseLeave={() => setHoveredItem(null)}
            className={cn(
              "relative z-10 flex items-center gap-2 px-2 sm:px-4 py-2 text-sm font-medium transition-all duration-200 rounded-full",
              isActive || isHovered
                ? "text-white"
                : "text-slate-400 hover:text-white"
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors duration-200",
                  isActive || isHovered ? item.iconColor : "text-current"
                )}
              />
            )}
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        )
      })}
    </div>
  )
}