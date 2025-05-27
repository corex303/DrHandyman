'use client';

import { PaymentElement, useElements,useStripe } from '@stripe/react-stripe-js';
import { StripePaymentElementOptions } from '@stripe/stripe-js';
import React, { useEffect,useState } from 'react';

interface CheckoutFormProps {
  invoiceNumber?: string;
  amount?: number;
  email?: string;
}

export default function CheckoutForm({ invoiceNumber: propInvoice, amount: propAmount, email: propEmail }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [invoiceNumber, setInvoiceNumber] = useState(propInvoice || '');
  const [amount, setAmount] = useState(propAmount ? propAmount.toFixed(2) : '');
  const [email, setEmail] = useState(propEmail || '');
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (propInvoice) setInvoiceNumber(propInvoice);
  }, [propInvoice]);

  useEffect(() => {
    if (propAmount) setAmount(propAmount.toFixed(2));
  }, [propAmount]);

  useEffect(() => {
    if (propEmail) setEmail(propEmail);
  }, [propEmail]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setMessage("Stripe.js has not loaded yet. Please try again in a moment.");
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/confirmation`,
        receipt_email: email || undefined,
      },
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "An unexpected error occurred.");
      } else {
        setMessage("An unexpected error occurred.");
      }
    } else {
      setMessage("Payment processing...");
    }

    setIsLoading(false);
  };

  const paymentElementOptions: StripePaymentElementOptions = {
    layout: "tabs",
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="checkoutInvoiceNumber" className="block text-sm font-medium text-gray-700">
          Invoice Number
        </label>
        <input
          type="text"
          id="checkoutInvoiceNumber"
          value={invoiceNumber}
          readOnly
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="checkoutAmount" className="block text-sm font-medium text-gray-700">
          Amount (USD)
        </label>
        <input
          type="text"
          id="checkoutAmount"
          value={amount}
          readOnly
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="checkoutEmail" className="block text-sm font-medium text-gray-700">
          Email (for receipt)
        </label>
        <input
          type="email"
          id="checkoutEmail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <PaymentElement id="payment-element" options={paymentElementOptions} />
      
      <button 
        disabled={isLoading || !stripe || !elements} 
        id="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        <span id="button-text">
          {isLoading ? <div className="spinner" id="spinner"></div> : "Pay now"}
        </span>
      </button>
      
      {message && <div id="payment-message" className={`text-sm ${message.includes("error") ? 'text-red-500' : 'text-green-500'}`}>{message}</div>}

      <style jsx>{`
        .spinner,
        .spinner:before,
        .spinner:after {
          border-radius: 50%;
        }
        .spinner {
          color: #fff;
          font-size: 22px;
          text-indent: -99999px;
          margin: 0px auto;
          position: relative;
          width: 20px;
          height: 20px;
          box-shadow: inset 0 0 0 2px;
          transform: translateZ(0);
        }
        .spinner:before,
        .spinner:after {
          position: absolute;
          content: "";
        }
        .spinner:before {
          width: 10.4px;
          height: 20.4px;
          background: #0ea5e9; /* Tailwind sky-500 */
          border-radius: 20.4px 0 0 20.4px;
          top: -0.2px;
          left: -0.2px;
          transform-origin: 10.4px 10.2px;
          animation: loading 2s infinite ease 1.5s;
        }
        .spinner:after {
          width: 10.4px;
          height: 10.2px;
          background: #0ea5e9; /* Tailwind sky-500 */
          border-radius: 0 10.2px 10.2px 0;
          top: -0.1px;
          left: 10.2px;
          transform-origin: 0px 10.2px;
          animation: loading 2s infinite ease;
        }
        @keyframes loading {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </form>
  );
} 