import { createContext, useContext, useState, useEffect } from 'react'

export interface CartItem {
  product_id: string
  product_name: string
  brand: string
  price_xof: number
  quantity: number
  image_url: string | null
  requires_prescription: boolean
  pharmacy_id: string
  pharmacy_name: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (product_id: string) => void
  updateQuantity: (product_id: string, quantity: number) => void
  clearCart: () => void
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  total: 0,
  itemCount: 0,
})

const CART_KEY = 'pharma_cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  }, [items])

  function addItem(newItem: CartItem) {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === newItem.product_id)
      if (existing) {
        return prev.map(i =>
          i.product_id === newItem.product_id
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        )
      }
      // Clear cart if different pharmacy
      if (prev.length > 0 && prev[0].pharmacy_id !== newItem.pharmacy_id) {
        return [newItem]
      }
      return [...prev, newItem]
    })
  }

  function removeItem(product_id: string) {
    setItems(prev => prev.filter(i => i.product_id !== product_id))
  }

  function updateQuantity(product_id: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(product_id)
      return
    }
    setItems(prev => prev.map(i => i.product_id === product_id ? { ...i, quantity } : i))
  }

  function clearCart() {
    setItems([])
  }

  const total = items.reduce((sum, i) => sum + i.price_xof * i.quantity, 0)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
