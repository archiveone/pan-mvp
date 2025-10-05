'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CreditCard, DollarSign, TrendingUp, Shield, AlertCircle, CheckCircle, ExternalLink, Sparkles, Zap, Star, ArrowRight, Users, Building2, Clock, Globe, Lock } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import BottomNav from '@/components/BottomNav';

interface PaymentAccount {
  id: string;
  type: 'individual' | 'business';
  status: 'pending' | 'active' | 'restricted' | 'rejected';
  email: string;
  country: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements: any[];
}

export default function PaymentSetupPage() {
  const { user } = useAuth();
  const [account, setAccount] = useState<PaymentAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPaymentAccount();
    }
  }, [user]);

  const fetchPaymentAccount = async () => {
    try {
      const response = await fetch('/api/stripe/get-connect-account');
      if (response.ok) {
        const data = await response.json();
        setAccount(data.account);
      }
    } catch (error) {
      console.error('Error fetching payment account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createPaymentAccount = async (type: 'individual' | 'business') => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/stripe/create-connect-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.account_link_url;
      } else {
        throw new Error('Failed to create payment account');
      }
    } catch (error) {
      console.error('Error creating payment account:', error);
      alert('Failed to create payment account. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'restricted': return 'text-red-600 bg-red-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'restricted': return <AlertCircle className="w-4 h-4" />;
      case 'rejected': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
        <AppFooter />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Setup</h1>
          <p className="text-gray-600">Set up your payment account to receive money from your listings</p>
        </div>

        {!account ? (
          // No account yet - show setup options
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
              
              <div className="relative z-10 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6 animate-pulse">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-4xl font-bold mb-4">Start Earning Today</h2>
                <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                  Set up your payment account and start receiving money from your listings in minutes
                </p>
                <div className="flex items-center justify-center space-x-6 text-white/80">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>2 min setup</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-5 h-5" />
                    <span>Global reach</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Lock className="w-5 h-5" />
                    <span>Bank-level security</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Type Selection */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 border-b">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Account Type</h3>
                <p className="text-gray-600">Select the account that best fits your selling needs</p>
              </div>

              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Individual Account */}
                  <div className="group relative overflow-hidden border-2 border-gray-200 rounded-2xl p-6 hover:border-green-300 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-green-200 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <Users className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Individual</h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        Perfect for freelancers, creators, and individuals selling their own products or services.
                      </p>
                      
                      <div className="space-y-3 mb-8">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-gray-700 font-medium">Quick 2-minute setup</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-gray-700 font-medium">Lower processing fees</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-gray-700 font-medium">Direct bank payouts</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-gray-700 font-medium">No monthly fees</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => createPaymentAccount('individual')}
                        disabled={isCreating}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                      >
                        {isCreating ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Creating Account...</span>
                          </>
                        ) : (
                          <>
                            <span>Start Individual Account</span>
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Business Account */}
                  <div className="group relative overflow-hidden border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex items-center space-x-1">
                          <Zap className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-semibold text-blue-600">PRO</span>
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Business</h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        Ideal for companies, organizations, and high-volume sellers with advanced needs.
                      </p>
                      
                      <div className="space-y-3 mb-8">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-gray-700 font-medium">Business verification</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-gray-700 font-medium">Advanced analytics</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-gray-700 font-medium">Team management</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-gray-700 font-medium">Priority support</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => createPaymentAccount('business')}
                        disabled={isCreating}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                      >
                        {isCreating ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Creating Account...</span>
                          </>
                        ) : (
                          <>
                            <span>Start Business Account</span>
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl p-8 border border-purple-100">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Pan Payments?</h3>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Join thousands of creators and entrepreneurs who trust Pan for their payment processing
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Bank-Level Security</h4>
                  <p className="text-gray-600">Your funds are protected with enterprise-grade security and fraud detection</p>
                </div>
                
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Lightning Fast Payouts</h4>
                  <p className="text-gray-600">Get paid within 2 business days with automatic payouts to your bank account</p>
                </div>
                
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Grow Your Business</h4>
                  <p className="text-gray-600">Accept payments from customers worldwide and scale your business globally</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Account exists - show status and management
          <div className="space-y-6">
            {/* Account Status */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Payment Account Status</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(account.status)}`}>
                  {getStatusIcon(account.status)}
                  {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Account Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{account.type === 'individual' ? 'Individual' : 'Business'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{account.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Country:</span>
                      <span className="font-medium">{account.country}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Charges Enabled:</span>
                      <span className={`font-medium ${account.charges_enabled ? 'text-green-600' : 'text-red-600'}`}>
                        {account.charges_enabled ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payouts Enabled:</span>
                      <span className={`font-medium ${account.payouts_enabled ? 'text-green-600' : 'text-red-600'}`}>
                        {account.payouts_enabled ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Account Actions</h3>
                  <div className="space-y-3">
                    {!account.details_submitted && (
                      <button
                        onClick={() => window.open('/api/stripe/connect-account-link', '_blank')}
                        className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Complete Account Setup
                      </button>
                    )}
                    
                    {account.requirements && account.requirements.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <h4 className="font-medium text-yellow-800 mb-2">Additional Requirements</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {account.requirements.map((req: any, index: number) => (
                            <li key={index}>• {req.description || req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Earnings Overview */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Overview</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">$0.00</div>
                  <div className="text-sm text-gray-600">Total Earnings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">$0.00</div>
                  <div className="text-sm text-gray-600">Available Balance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-sm text-gray-600">Successful Sales</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AppFooter />
      <BottomNav />
    </div>
  );
}
