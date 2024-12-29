import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStripe as useStripeContext } from '../../context/StripeContext';
import { useNavigate } from 'react-router-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function RegisterForm({ onClose }) {
  const [step, setStep] = useState('payment');
  const [isMonthly, setIsMonthly] = useState(false);
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
  const navigate = useNavigate();

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

  const handlePayment = async (e) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);
    
    try {
      if (!stripe || !elements) {
        throw new Error('Stripe not initialized');
      }

      const clientSecret = await createPaymentIntent(isMonthly);
      const cardElement = elements.getElement(CardElement);

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
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

      setFormData(prev => ({
        ...prev,
        paymentIntentId: paymentIntent.id
      }));

      setStep('details');
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (!formData.paymentIntentId) {
        throw new Error('Payment information is missing. Please try again.');
      }
      await register(formData.email, formData.password, formData.name, formData.paymentIntentId);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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

      <h2 className="text-2xl font-bold mb-6 text-center">
        {step === 'payment' ? 'Payment Information' : 'Create Account'}
      </h2>

      {error && (
        <div className="mb-4 p-2 bg-red-500/20 text-red-400 rounded text-center">
          {error}
        </div>
      )}

      {step === 'payment' ? (
        <form onSubmit={handlePayment} className="space-y-4">
          <div className="flex justify-center space-x-4 mb-6">
            <button
              type="button"
              onClick={() => setIsMonthly(false)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !isMonthly 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              One-time $1
            </button>
            <button
              type="button"
              onClick={() => setIsMonthly(true)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isMonthly 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Monthly $5
            </button>
          </div>

          <div className="p-3 bg-blue-500/20 rounded-lg text-center mb-4">
            <p className="text-blue-300">
              {isMonthly ? 'Monthly subscription: $5/month' : 'One-time payment: $1'}
            </p>
          </div>

          <div className="p-4 bg-black/30 rounded-lg border border-gray-700">
            <CardElement options={cardStyle} />
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className={`w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 
              transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isProcessing ? 'Processing...' : 'Pay & Continue'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegistration} className="space-y-4">
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
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Create Account
          </button>
        </form>
      )}
    </div>
  );
} 