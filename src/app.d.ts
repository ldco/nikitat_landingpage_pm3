declare global {
  namespace App {
    interface Locals {
      user?: {
        id: number
        email: string
        role: string
        name: string
      }
      nonce?: string
    }
  }
}

export {}
