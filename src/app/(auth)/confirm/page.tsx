'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { createClient } from '@/util/supabase/client'

export default function ConfirmPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const confirmEmail = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)

      if (error) {
        console.error('Confirmation failed:', error)
        router.replace('/login?message=Confirmation%20failed')
      } else {
        router.replace('/dashboard')
      }
    }

    confirmEmail()
  }, [router, supabase])

  return <p>Confirming your email...</p>
}
