import React, { createContext, useContext, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost.ssr.tax:3001'
  : 'http://localhost:3001';

console.log('Stripe Key:', process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
const StripeContext = createContext(null);

export const StripeProvider = ({ children }) => {
  const [paymentIntent, setPaymentIntent] = useState(null);

  const createPaymentIntent = async (isMonthly = false) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isMonthly }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      setPaymentIntent(data.clientSecret);
      return data.clientSecret;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  };

  const processPayment = async (paymentMethod) => {
    try {
      const stripe = await stripePromise;
      if (!stripe || !paymentIntent) {
        throw new Error('Stripe not initialized');
      }

      const { error, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(
        paymentIntent,
        {
          payment_method: paymentMethod.id,
        }
      );

      if (error) {
        throw error;
      }

      return confirmedIntent;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  };

  return (
    <Elements stripe={stripePromise}>
      <StripeContext.Provider value={{ createPaymentIntent, processPayment, paymentIntent }}>
        {children}
      </StripeContext.Provider>
    </Elements>
  );
};

export const useStripe = () => {
  const context = useContext(StripeContext);
  if (!context) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
}; 