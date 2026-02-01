'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Navbar } from '@/components/navbar';
import { Button, Input } from '@/components/ui';

export default function EarningsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, isAuthenticated } = useAuthStore();
  const [tipsEnabled, setTipsEnabled] = useState(false);
  const [minimumTip, setMinimumTip] = useState('1.00');

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['monetisation-profile'],
    queryFn: () => api.getMonetisationProfile(token!),
    enabled: isAuthenticated && !!token,
    onSuccess: (data: any) => {
      if (data) {
        setTipsEnabled(data.tipsEnabled || false);
        setMinimumTip(((data.minimumTipAmount || 100) / 100).toFixed(2));
      }
    },
  } as any);

  const { data: connectStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['stripe-connect-status'],
    queryFn: () => api.getStripeConnectStatus(token!),
    enabled: isAuthenticated && !!token,
  });

  const { data: stats } = useQuery({
    queryKey: ['tip-stats'],
    queryFn: () => api.getTipStats(token!),
    enabled: isAuthenticated && !!token,
  });

  const { data: tipsData } = useQuery({
    queryKey: ['tips-received'],
    queryFn: () => api.getTipsReceived(token!),
    enabled: isAuthenticated && !!token,
  });

  const connectMutation = useMutation({
    mutationFn: () => api.createStripeConnectLink(window.location.href, token!),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { tipsEnabled?: boolean; minimumTipAmount?: number }) =>
      api.updateMonetisationProfile(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monetisation-profile'] });
    },
  });

  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  const isLoading = profileLoading || statusLoading;

  const handleSaveSettings = () => {
    const minAmount = Math.round(parseFloat(minimumTip) * 100);
    updateProfileMutation.mutate({
      tipsEnabled,
      minimumTipAmount: Math.max(100, minAmount),
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Earnings & Tips</h1>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-500">Total Earned</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${((stats?.totalReceived || 0) / 100).toFixed(2)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${((stats?.thisMonth || 0) / 100).toFixed(2)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-500">Total Tips</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.tipCount || 0}
                </p>
              </div>
            </div>

            {/* Stripe Connect Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Setup</h2>

              {connectStatus?.onboarded ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Stripe Connected</p>
                    <p className="text-sm text-gray-500">
                      {connectStatus.canReceivePayments
                        ? 'Your account is ready to receive payments'
                        : 'Account setup incomplete - please verify your account on Stripe'}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">
                    Connect your Stripe account to receive tips from your readers. Stripe handles all
                    payments securely.
                  </p>
                  <Button
                    onClick={() => connectMutation.mutate()}
                    disabled={connectMutation.isPending}
                  >
                    {connectMutation.isPending ? 'Connecting...' : 'Connect with Stripe'}
                  </Button>
                </div>
              )}
            </div>

            {/* Tip Settings */}
            {connectStatus?.onboarded && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Tip Settings</h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Enable Tips</p>
                      <p className="text-sm text-gray-500">Allow readers to send you tips</p>
                    </div>
                    <button
                      onClick={() => setTipsEnabled(!tipsEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        tipsEnabled ? 'bg-sky-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          tipsEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Tip Amount
                    </label>
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        min="1.00"
                        step="0.01"
                        value={minimumTip}
                        onChange={(e) => setMinimumTip(e.target.value)}
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveSettings} disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </div>
            )}

            {/* Recent Tips */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Tips</h2>

              {tipsData?.tips && tipsData.tips.length > 0 ? (
                <div className="space-y-4">
                  {tipsData.tips.map((tip: any) => (
                    <div key={tip.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      {tip.sender.avatarUrl ? (
                        <img
                          src={tip.sender.avatarUrl}
                          alt={tip.sender.username}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
                          <span className="text-sky-600 font-medium">
                            {(tip.sender.displayName || tip.sender.username).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">
                            {tip.sender.displayName || tip.sender.username}
                          </p>
                          <p className="font-semibold text-green-600">
                            +${(tip.amount / 100).toFixed(2)}
                          </p>
                        </div>
                        {tip.story && (
                          <p className="text-sm text-gray-500">
                            For &ldquo;{tip.story.title}&rdquo;
                          </p>
                        )}
                        {tip.message && (
                          <p className="text-sm text-gray-600 mt-1">&ldquo;{tip.message}&rdquo;</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">{formatDate(tip.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">No tips received yet</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
