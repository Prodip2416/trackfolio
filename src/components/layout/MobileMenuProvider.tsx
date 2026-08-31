'use client'

import { createContext, useContext, useState } from 'react'

const MobileMenuContext = createContext<{
  isOpen: boolean
  setIsOpen: (val: boolean) => void
}>({
  isOpen: false,
  setIsOpen: () => {}
})

export function MobileMenuProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <MobileMenuContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </MobileMenuContext.Provider>
  )
}

export function useMobileMenu() {
  return useContext(MobileMenuContext)
}
