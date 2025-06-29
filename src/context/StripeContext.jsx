import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Define API URL based on environment
const API_URL = 'http://b0cwgosscocoskkggsgs804w.85.31.224.91.sslip.io';

// Use the publishable key directly for now
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51QRPF6GDlcFzOwRVEJvLkMMRszuqwYRWbkkWohm4sMriIscHDCSIy3bbjzjs8Ru0Lcn5zr73r7jRET97blOySnfj000SweidEo';

console.log('Environment:', process.env.NODE_ENV);
console.log('Using direct Stripe key');

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Log the stripe promise
stripePromise.then(stripe => {
  console.log('Stripe loaded:', !!stripe);
}).catch(err => {
  console.error('Stripe loading error:', err);
});

const StripeContext = createContext(null);

export const StripeProvider = ({ children }) => {
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [stripeLoaded, setStripeLoaded] = useState(false);

  useEffect(() => {
    stripePromise.then(stripe => {
      console.log('Stripe initialized in provider:', !!stripe);
      setStripeLoaded(!!stripe);
    }).catch(err => {
      console.error('Stripe initialization error in provider:', err);
    });
  }, []);

  const createPaymentIntent = async (isMonthly = false) => {
    try {
      if (!stripeLoaded) {
        console.error('Stripe not loaded when creating payment intent');
        throw new Error('Stripe is not initialized yet. Please try again.');
      }

      const response = await fetch(`${API_URL}/payment/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ isMonthly }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create payment intent');
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
        console.error('Stripe or payment intent missing:', { stripe: !!stripe, paymentIntent: !!paymentIntent });
        throw new Error('Stripe not initialized or payment intent missing');
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