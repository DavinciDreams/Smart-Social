import React, { useState } from 'react';
import { LoadingSpinner } from '../UI/LoadingSpinner';

interface SignupFormProps {
  onSignup: (email: string, password: string, name: string) => Promise<void>;
  onSwitchToLogin: () => void;
  loading?: boolean;
  error?: string | null;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSignup,
  onSwitchToLogin,
  loading = false,
  error
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password && name && password === confirmPassword && acceptTerms) {
      await onSignup(email, password, name);
    }
  };

  const handleSocialSignup = (provider: 'twitter' | 'reddit') => {
    // TODO: Implement OAuth flow
    window.location.href = `/api/auth/${provider}`;
  };

  const passwordsMatch = password === confirmPassword;
  const isFormValid = email && password && name && passwordsMatch && acceptTerms;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-600 mt-2">Join the anti-brain rot revolution</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Social Signup Buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleSocialSignup('twitter')}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <div className="w-5 h-5 mr-3 bg-blue-400 rounded-full"></div>
            Sign up with Twitter/X
          </button>
          
          <button
            onClick={() => handleSocialSignup('reddit')}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <div className="w-5 h-5 mr-3 bg-orange-500 rounded-full"></div>
            Sign up with Reddit
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or create account with email</span>
          </div>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your full name"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Create a password"
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be at least 8 characters long
            </p>
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                confirmPassword && !passwordsMatch 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300'
              }`}
              placeholder="Confirm your password"
            />
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-600 mt-1">
                Passwords do not match
              </p>
            )}
          </div>
          
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="acceptTerms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-2 text-sm">
              <label htmlFor="acceptTerms" className="text-gray-600">
                I agree to the{' '}
                <a href="#" className="text-blue-600 hover:text-blue-800">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-blue-600 hover:text-blue-800">Privacy Policy</a>
              </label>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <LoadingSpinner size="small" />
                <span className="ml-2">Creating account...</span>
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        {/* Switch to Login */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
