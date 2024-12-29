import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStripe as useStripeContext } from '../../context/StripeContext';
import { useNavigate } from 'react-router-dom';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';

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

  const cardElementOptions = {
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

  const handlePayment = async (e) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);
    
    try {
      if (!stripe || !elements) {
        throw new Error('Stripe not initialized');
      }

      const clientSecret = await createPaymentIntent(isMonthly);
      
      // Get the ZIP code value
      const zipCode = e.target.querySelector('input[name="zip"]').value;
      
      if (!zipCode || zipCode.length !== 5) {
        throw new Error('Please enter a valid ZIP code');
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardNumberElement),
        billing_details: {
          address: {
            postal_code: zipCode
          }
        }
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
    <div className="max-w-md mx-auto p-8 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-2xl">
      <button
        onClick={onClose}
        className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gray-800 
          flex items-center justify-center text-gray-400 hover:text-white
          transition-colors border border-gray-700 hover:border-gray-600"
      >
        ×
      </button>

      <h2 className="text-2xl font-bold mb-6 text-center">
        {step === 'payment' ? 'Payment Information' : 'Create Account'}
      </h2>

      {error && (
        <div className="mb-6 p-3 bg-red-500/20 text-red-400 rounded-lg text-center border border-red-500/20">
          {error}
        </div>
      )}

      {step === 'payment' ? (
        <form onSubmit={handlePayment} className="space-y-6">
          <div className="flex justify-center space-x-4 mb-6">
            <button
              type="button"
              onClick={() => setIsMonthly(false)}
              className={`px-6 py-3 rounded-lg transition-all ${
                !isMonthly 
                  ? 'bg-blue-500 text-white scale-105 shadow-lg' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              One-time $10
            </button>
            <button
              type="button"
              onClick={() => setIsMonthly(true)}
              className={`px-6 py-3 rounded-lg transition-all ${
                isMonthly 
                  ? 'bg-purple-500 text-white scale-105 shadow-lg' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Monthly $5
            </button>
          </div>

          <div className="p-4 bg-blue-500/10 rounded-lg text-center mb-6 border border-blue-500/20">
            <p className="text-blue-300 font-medium">
              {isMonthly ? 'Monthly subscription: $5/month' : 'One-time payment: $10'}
            </p>
            <p className="text-sm text-blue-300/80 mt-1">
              {isMonthly ? 'Cancel anytime' : 'Lifetime access'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-black/30 rounded-lg border border-gray-700">
              <label className="block text-sm font-medium mb-2 text-gray-200">Card Number</label>
              <CardNumberElement options={cardElementOptions} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-black/30 rounded-lg border border-gray-700">
                <label className="block text-sm font-medium mb-2 text-gray-200">Expiration Date</label>
                <CardExpiryElement options={cardElementOptions} />
              </div>

              <div className="p-4 bg-black/30 rounded-lg border border-gray-700">
                <label className="block text-sm font-medium mb-2 text-gray-200">CVC</label>
                <CardCvcElement options={cardElementOptions} />
              </div>
            </div>

            <div className="p-4 bg-black/30 rounded-lg border border-gray-700">
              <label className="block text-sm font-medium mb-2 text-gray-200">ZIP Code</label>
              <input
                type="text"
                name="zip"
                placeholder="12345"
                className="w-full bg-transparent border-none text-white placeholder-gray-500 focus:outline-none focus:ring-0"
                maxLength="5"
                pattern="[0-9]*"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className={`w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 
              text-white rounded-lg font-semibold transition-all
              hover:from-blue-600 hover:to-purple-700 
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : 'Pay & Continue'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegistration} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-200">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-black/30 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-200">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-black/30 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-200">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-black/30 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors text-white"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 
              text-white rounded-lg font-semibold transition-all
              hover:from-blue-600 hover:to-purple-700 hover:scale-[1.02]
              mt-6"
          >
            Create Account
          </button>
        </form>
      )}
    </div>
  );
} 