'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Button, Input } from '@/components/ui';

interface TipModalProps {
  authorId: string;
  authorName: string;
  minimumAmount: number;
  storyId?: string;
  storyTitle?: string;
  onClose: () => void;
}

const PRESET_AMOUNTS = [100, 300, 500, 1000, 2000]; // In cents

export function TipModal({ authorId, authorName, minimumAmount, storyId, storyTitle, onClose }: TipModalProps) {
  const { token } = useAuthStore();
  const [amount, setAmount] = useState(Math.max(300, minimumAmount));
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'select' | 'processing' | 'success'>('select');

  const tipMutation = useMutation({
    mutationFn: async () => {
      const tipAmount = customAmount ? Math.round(parseFloat(customAmount) * 100) : amount;

      if (tipAmount < minimumAmount) {
        throw new Error(`Minimum tip amount is $${(minimumAmount / 100).toFixed(2)}`);
      }

      const result = await api.createTip(
        {
          recipientId: authorId,
          amount: tipAmount,
          message: message || undefined,
          storyId,
        },
        token!
      );

      // In a real app, you'd use Stripe Elements to collect card details
      // and confirm the payment intent with the clientSecret
      // For now, we'll simulate the confirmation
      await api.confirmTip(result.clientSecret.split('_secret_')[0], token!);

      return result;
    },
    onSuccess: () => {
      setStep('success');
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to process tip');
      setStep('select');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStep('processing');
    tipMutation.mutate();
  };

  const formatAmount = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const currentAmount = customAmount ? Math.round(parseFloat(customAmount) * 100) : amount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {step === 'success' ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Tip Sent!</h2>
            <p className="text-gray-600 mb-6">
              Your {formatAmount(currentAmount)} tip has been sent to {authorName}.
            </p>
            <Button onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Send a Tip to {authorName}
            </h2>
            {storyTitle && (
              <p className="text-sm text-gray-500 mb-4">
                For &ldquo;{storyTitle}&rdquo;
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Amount
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_AMOUNTS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setAmount(preset);
                        setCustomAmount('');
                      }}
                      disabled={preset < minimumAmount}
                      className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                        amount === preset && !customAmount
                          ? 'bg-sky-500 text-white border-sky-500'
                          : preset < minimumAmount
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-sky-500'
                      }`}
                    >
                      {formatAmount(preset)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="custom-amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Or enter custom amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    id="custom-amount"
                    type="number"
                    min={(minimumAmount / 100).toFixed(2)}
                    step="0.01"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder={(minimumAmount / 100).toFixed(2)}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Minimum: {formatAmount(minimumAmount)}
                </p>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Thank you for your amazing story!"
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-4 text-sm">
                  <span className="text-gray-600">Tip Amount</span>
                  <span className="font-semibold">{formatAmount(currentAmount)}</span>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={step === 'processing' || currentAmount < minimumAmount}
                >
                  {step === 'processing' ? 'Processing...' : `Send ${formatAmount(currentAmount)} Tip`}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
