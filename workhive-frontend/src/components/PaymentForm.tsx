import React, { useState } from 'react'
import { 
  PaymentElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js'
import { toast } from 'sonner'
import { Loader2, ShieldCheck, Lock } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface PaymentFormProps {
  clientSecret: string
  contractId: string
  amount: number
  onSuccess: () => void
}

export function PaymentForm({ amount, onSuccess }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setIsProcessing(true)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })

    if (error) {
      toast.error(error.message || 'Something went wrong')
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      toast.success('Payment successful!')
      onSuccess()
    }

    setIsProcessing(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg border mb-6 flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Amount</span>
        <span className="text-2xl font-bold text-gray-900">${amount.toLocaleString()}</span>
      </div>

      <PaymentElement />
      
      <div className="pt-4">
        <Button 
          type="submit" 
          disabled={!stripe || isProcessing} 
          className="w-full h-12 text-lg shadow-lg bg-indigo-600 hover:bg-indigo-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ShieldCheck className="mr-2 h-5 w-5" />
              Pay and Fund Contract
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
        <Lock className="h-3 w-3" />
        <span>Secure payment processing by Stripe</span>
      </div>
    </form>
  )
}
