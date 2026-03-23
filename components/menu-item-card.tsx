import Image from 'next/image'
import type { MenuItem, ItemOption } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface MenuItemCardProps {
  item: MenuItem & { item_options?: ItemOption[] }
  disabled?: boolean
  onClick?: () => void
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  // Matched loosely by category name keywords — fallback handled below
  matcha: 'from-green-100 to-green-200',
  coffee: 'from-amber-100 to-amber-200',
  energy: 'from-blue-100 to-blue-200',
  treats: 'from-orange-100 to-orange-200',
}

function getCategoryGradient(categoryId: string): string {
  // We don't have the category name here, just id — use a warm fallback
  return 'from-warm-100 to-warm-200'
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

export function MenuItemCard({ item, disabled = false, onClick }: MenuItemCardProps) {
  return (
    <Card
      className={`rounded-2xl bg-white border-warm-200 overflow-hidden transition-shadow ${
        disabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'
      }`}
      onClick={disabled ? undefined : onClick}
    >
      {/* Image area */}
      <div className="relative h-40 w-full overflow-hidden">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br from-warm-100 to-warm-200 flex items-center justify-center`}>
            <span className="text-4xl select-none">☕</span>
          </div>
        )}
      </div>

      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-warm-600 text-sm leading-snug line-clamp-1">
            {item.name}
          </h3>
          <span className="font-mono text-sm font-medium text-warm-500 shrink-0">
            {formatPrice(item.price)}
          </span>
        </div>

        {item.description && (
          <p className="text-xs text-warm-400 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}

        <Button
          size="sm"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation()
            if (!disabled && onClick) onClick()
          }}
          className="mt-1 w-full bg-warm-600 hover:bg-warm-700 text-white text-xs rounded-xl"
        >
          {disabled
            ? 'Closed'
            : item.item_options && item.item_options.length > 0
              ? 'Customize'
              : 'Add'}
        </Button>
      </CardContent>
    </Card>
  )
}
