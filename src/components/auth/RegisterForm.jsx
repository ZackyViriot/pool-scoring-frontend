import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useStripe as useStripeContext } from '../../context/StripeContext';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function RegisterForm({ onClose }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    paymentIntentId: '',
  });
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
  const { createPaymentIntent } = useStripeContext();
  const stripe = useStripe();
  const elements = useElements();

  // Password validation states
  const passwordValid = formData.password.length >= 6;
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;
  const confirmPasswordValid = formData.confirmPassword.length > 0;

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

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      if (!stripe || !elements) {
        throw new Error('Stripe not initialized');
      }

      console.log('Starting payment process...');

      // Create payment intent
      const clientSecret = await createPaymentIntent();
      console.log('Payment intent created, client secret received');
      
      // Get the card elements
      const cardNumber = elements.getElement(CardNumberElement);
      const cardExpiry = elements.getElement(CardExpiryElement);
      const cardCvc = elements.getElement(CardCvcElement);

      if (!cardNumber || !cardExpiry || !cardCvc) {
        throw new Error('Please fill in all card details');
      }

      console.log('Creating payment method...');

      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumber,
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message || 'Failed to create payment method');
      }

      console.log('Payment method created, confirming payment...');

      // Confirm the payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod.id,
      });

      if (confirmError) {
        console.error('Payment confirmation error:', confirmError);
        throw new Error(confirmError.message || 'Payment failed');
      }

      if (paymentIntent.status === 'succeeded') {
        console.log('Payment confirmed successfully:', paymentIntent.id);
        
        // Add a small delay to ensure payment is fully processed
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Proceeding with user registration...');
        
        // Register the user with the payment intent
        await register(formData.email, formData.password, formData.name, paymentIntent.id);
      } else {
        console.error('Payment not successful, status:', paymentIntent.status);
        throw new Error(`Payment was not successful (status: ${paymentIntent.status}). Please try again.`);
      }
      
    } catch (err) {
      console.error('Registration error:', err);
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full p-2 pr-10 rounded bg-black/30 border focus:outline-none ${
                  formData.password.length > 0 
                    ? passwordValid 
                      ? 'border-green-500 focus:border-green-400' 
                      : 'border-red-500 focus:border-red-400'
                    : 'border-gray-700 focus:border-blue-500'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                )}
              </button>
            </div>
            <div className="flex items-center mt-1">
              <p className={`text-xs ${passwordValid ? 'text-green-400' : 'text-gray-400'}`}>
                Minimum 6 characters
              </p>
              {formData.password.length > 0 && (
                <span className={`ml-2 text-xs ${passwordValid ? 'text-green-400' : 'text-red-400'}`}>
                  {passwordValid ? '✓' : '✗'}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full p-2 pr-10 rounded bg-black/30 border focus:outline-none ${
                  confirmPasswordValid 
                    ? passwordsMatch 
                      ? 'border-green-500 focus:border-green-400' 
                      : 'border-red-500 focus:border-red-400'
                    : 'border-gray-700 focus:border-blue-500'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                )}
              </button>
            </div>
            {confirmPasswordValid && (
              <div className="flex items-center mt-1">
                <p className={`text-xs ${passwordsMatch ? 'text-green-400' : 'text-red-400'}`}>
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </p>
                <span className={`ml-2 text-xs ${passwordsMatch ? 'text-green-400' : 'text-red-400'}`}>
                  {passwordsMatch ? '✓' : '✗'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-400 border-b border-green-500/30 pb-2">
            Payment Information
          </h3>
          
          <div className="p-3 bg-blue-500/20 rounded-lg text-center">
            <p className="text-blue-300">
              One-time payment: $20
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