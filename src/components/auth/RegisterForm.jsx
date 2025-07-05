import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useStripe as useStripeContext } from '../../context/StripeContext';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function RegisterForm({ onClose }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    paymentIntentId: '',
  });
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { register } = useAuth();
  const { createPaymentIntent } = useStripeContext();
  const stripe = useStripe();
  const elements = useElements();

  const cardStyle = {
    style: {
      base: {
        color: '#fff',
        fontFamily: 'Arial, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#6b7280',
        },
        backgroundColor: 'transparent',
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    },
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);
    
    try {
      if (!stripe || !elements) {
        throw new Error('Stripe not initialized');
      }

      const clientSecret = await createPaymentIntent();
      
      // Get the card elements
      const cardNumber = elements.getElement(CardNumberElement);
      const cardExpiry = elements.getElement(CardExpiryElement);
      const cardCvc = elements.getElement(CardCvcElement);

      if (!cardNumber || !cardExpiry || !cardCvc) {
        throw new Error('Please fill in all card details');
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumber,
      });

      if (error) {
        throw error;
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod.id,
      });

      if (confirmError) {
        throw confirmError;
      }

      // Register the user with the payment intent
      await register(formData.email, formData.password, formData.name, paymentIntent.id);
      
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
      <button
        onClick={onClose}
        className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gray-800 
          flex items-center justify-center text-gray-400 hover:text-white
          transition-colors border border-gray-700"
      >
        ×
      </button>

      <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>

      {error && (
        <div className="mb-4 p-2 bg-red-500/20 text-red-400 rounded text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Creation Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-blue-400 border-b border-blue-500/30 pb-2">
            Account Information
          </h3>
          
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 rounded bg-black/30 border border-gray-700 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 rounded bg-black/30 border border-gray-700 focus:border-blue-500 focus:outline-none"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Email is not case sensitive</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 rounded bg-black/30 border border-gray-700 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Payment Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-400 border-b border-green-500/30 pb-2">
            Payment Information
          </h3>
          
          <div className="p-3 bg-blue-500/20 rounded-lg text-center">
            <p className="text-blue-300">
              One-time payment: $10
            </p>
          </div>

          <div className="space-y-4 bg-black/30 rounded-lg border border-gray-700 p-4">
            <div>
              <label className="block text-sm font-medium mb-1">Card Number</label>
              <div className="p-3 bg-black/30 rounded border border-gray-700">
                <CardNumberElement options={cardStyle} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Expiration Date</label>
                <div className="p-3 bg-black/30 rounded border border-gray-700">
                  <CardExpiryElement options={cardStyle} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CVC</label>
                <div className="p-3 bg-black/30 rounded border border-gray-700">
                  <CardCvcElement options={cardStyle} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className={`w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 
            transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isProcessing ? 'Creating Account...' : 'Create Account & Pay'}
        </button>
      </form>
    </div>
  );
} 