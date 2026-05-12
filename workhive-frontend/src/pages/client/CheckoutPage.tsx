import { useState, useEffect, useRef } from "react"
import { useParams, Link, useNavigate } from "react-router"
import { loadStripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { toast } from "sonner"
import { ArrowLeft, Loader2, CreditCard, ShieldCheck } from "lucide-react"

import { useGetContractQuery } from "@/store/api/contractsApi"
import { useCreatePaymentIntentMutation, useGetPaymentByContractQuery } from "@/store/api/paymentsApi"
import { PaymentForm } from "@/components/PaymentForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "")

export default function CheckoutPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const { data: contractData, isLoading: isLoadingContract } = useGetContractQuery(id!)
  const { data: paymentData, isLoading: isLoadingPayment } = useGetPaymentByContractQuery(id!)
  const [createIntent, { isLoading: isCreatingIntent }] = useCreatePaymentIntentMutation()
  
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const intentInitiated = useRef(false)

  const contract = contractData?.data
  const payments = paymentData?.data
  const existingPayment = Array.isArray(payments) ? payments.find(p => p.status === 'pending' || p.status === 'paid') : null

  useEffect(() => {
    if (contract && contract.status === 'active' && !clientSecret && !isCreatingIntent && !isLoadingPayment) {
      if (existingPayment && existingPayment.status === 'paid') return;
      
      if (intentInitiated.current) return;
      intentInitiated.current = true;

      createIntent({ contract_id: contract.id })
        .unwrap()
        .then((res) => {
          setClientSecret(res.data.client_secret)
        })
        .catch((err) => {
          const message = err.data?.message || "Failed to initialize payment"
          if (message.includes("already been paid")) {
            toast.success("Payment confirmed!")
            navigate(`/client/contracts/${contract.id}`)
          } else {
            setError(message)
          }
          intentInitiated.current = false;
        })
    } 
  }, [contract, existingPayment, createIntent, isCreatingIntent, isLoadingPayment])

  if (isLoadingContract || isLoadingPayment || isCreatingIntent) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!contract) {
    return <div>Contract not found.</div>
  }

  if (existingPayment && existingPayment.status === 'paid') {
    return (
      <div className="max-w-md mx-auto mt-12">
        <Alert className="bg-green-50 border-green-200">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <AlertTitle>Already Paid</AlertTitle>
          <AlertDescription>
            This contract has already been funded. 
          </AlertDescription>
        </Alert>
        <Button className="w-full mt-4" asChild>
          <Link to={`/client/contracts/${contract.id}`}>Return to Contract</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/client/contracts/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Checkout</h1>
          <p className="text-muted-foreground">Review and complete your payment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-gray-200">
            <CardHeader>
              <CardTitle>Project Summary</CardTitle>
              <CardDescription>Contract details and amount</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">{contract.job?.title}</p>
                  <p className="text-sm text-muted-foreground">Freelancer: {contract.freelancer?.full_name}</p>
                </div>
                <div className="font-bold text-lg">${contract.amount}</div>
              </div>
              <Separator />
              <div className="flex justify-between items-center pt-2">
                <span className="text-muted-foreground font-medium">Subtotal</span>
                <span>${contract.amount}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold text-indigo-600">
                <span>Amount Due</span>
                <span>${contract.amount}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-indigo-50/50 border-indigo-100 shadow-none">
            <CardContent className="p-4 flex gap-3 text-sm text-indigo-800">
              <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0" />
              <p>
                Your funds will be held in escrow and released to the freelancer only after you approve the final delivery.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg ring-1 ring-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-600" />
              Payment Method
            </CardTitle>
            <CardDescription>Securely pay via credit or debit card</CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm 
                  clientSecret={clientSecret} 
                  contractId={contract.id} 
                  amount={contract.amount}
                  onSuccess={() => navigate(`/client/contracts/${contract.id}`)}
                />
              </Elements>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Preparing secure payment session...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
