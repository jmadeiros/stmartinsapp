"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { PostCategory } from "@/lib/types"
import { categoryConfig } from "./category-badge"

interface CategorySelectorProps {
  selected: PostCategory
  onChange: (category: PostCategory) => void
  className?: string
}

const categories: PostCategory[] = ["general", "intros", "wins", "opportunities", "questions", "learnings"]

export function CategorySelector({ selected, onChange, className }: CategorySelectorProps) {
  const [expanded, setExpanded] = useState(false)

  const orderedCategories = expanded
    ? [selected, ...categories.filter((category) => category !== selected)]
    : [selected]
  
  const handleButtonClick = (category: PostCategory) => {
    if (!expanded) {
      // First tap opens the menu (for touch / mobile)
      setExpanded(true)
      return
    }
    
    onChange(category)
    setExpanded(false)
  }
  
  return (
    <div 
      className={cn("relative flex items-center gap-x-1.5", className)}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onFocus={() => setExpanded(true)}
      onBlur={() => setExpanded(false)}
    >
      {orderedCategories.map((category, index) => {
        const config = categoryConfig[category]
        const Icon = config.icon
        const isSelected = selected === category
        const isFirst = index === 0
        
        return (
          <motion.button
            key={category}
            type="button"
            onClick={() => handleButtonClick(category)}
            initial={false}
            animate={{ 
              x: expanded ? 0 : -40 * index,
              opacity: expanded || isFirst ? 1 : 0,
            }}
            transition={{
              duration: 0.4,
              ease: [0.4, 0, 0.2, 1],
              delay: expanded ? 0.03 * index : 0,
            }}
            style={{ 
              zIndex: expanded ? 100 - index : orderedCategories.length - index,
              pointerEvents: expanded || isFirst ? "auto" : "none",
              display: expanded || isFirst ? "inline-flex" : "none",
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border",
              "text-xs font-medium whitespace-nowrap",
              "backdrop-blur-sm transition-colors duration-200",
              isSelected ? (
                cn(
                  config.gradient,
                  config.border,
                  config.text,
                  "shadow-sm"
                )
              ) : (
                "bg-white/90 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
              )
            )}
          >
            <Icon
              className={cn(
                "h-3.5 w-3.5 flex-shrink-0 transition-colors duration-200",
                isSelected ? config.text : "text-gray-400"
              )}
            />
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ 
                opacity: expanded ? 1 : 0,
                width: expanded ? "auto" : 0,
              }}
              transition={{
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="overflow-hidden"
            >
              {config.label}
            </motion.span>
          </motion.button>
        )
      })}
    </div>
  )
}

