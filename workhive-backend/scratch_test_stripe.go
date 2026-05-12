package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/stripe/stripe-go/v81"
	"github.com/stripe/stripe-go/v81/paymentintent"
)

func main() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
	
	// Use a known ID if possible, or just create a new one to test
	params := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(1000),
		Currency: stripe.String(string(stripe.CurrencyUSD)),
		AutomaticPaymentMethods: &stripe.PaymentIntentAutomaticPaymentMethodsParams{
			Enabled: stripe.Bool(true),
		},
	}

	pi, err := paymentintent.New(params)
	if err != nil {
		log.Fatalf("Error creating intent: %v", err)
	}

	fmt.Printf("ID: %s\n", pi.ID)
	fmt.Printf("ClientSecret: %s\n", pi.ClientSecret)
}
