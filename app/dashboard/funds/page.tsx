'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, ArrowDownLeft, History, AlertCircle, Sparkles, Zap, Star, Target, Award, BarChart3, Wallet, Shield, Clock, Globe } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import BottomNav from '@/components/BottomNav';

interface Transaction {
  id: string;
  type: 'sale' | 'payout' | 'refund';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export default function FundsPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFundsData();
    }
  }, [user]);

  const loadFundsData = async () => {
    try {
      // Mock data - in real app, fetch from your API
      setBalance(1250.50);
      setPendingAmount(340.25);
      setTransactions([
        {
          id: '1',
          type: 'sale',
          amount: 150.00,
          description: 'Vintage Camera Sale',
          date: '2024-01-15T10:30:00Z',
          status: 'completed'
        },
        {
          id: '2',
          type: 'payout',
          amount: -500.00,
          description: 'Payout to Bank Account',
          date: '2024-01-14T09:15:00Z',
          status: 'completed'
        },
        {
          id: '3',
          type: 'sale',
          amount: 75.50,
          description: 'Art Print Sale',
          date: '2024-01-13T14:20:00Z',
          status: 'pending'
        }
      ]);
    } catch (error) {
      console.error('Error loading funds data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sale': return <ArrowUpRight className="w-4 h-4 text-green-600" />;
      case 'payout': return <ArrowDownLeft className="w-4 h-4 text-blue-600" />;
      case 'refund': return <ArrowDownLeft className="w-4 h-4 text-red-600" />;
      default: return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fund Management</h1>
          <p className="text-gray-600">Track your earnings and manage payouts</p>
        </div>

        {/* Hero Balance Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-green-500 via-blue-500 to-purple-600 rounded-3xl p-8 text-white mb-8">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Your Earnings</h2>
                <p className="text-white/80">Track your success and manage your funds</p>
              </div>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full animate-pulse">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-white/80">Available Balance</h3>
                    <p className="text-4xl font-bold text-white">{formatCurrency(balance)}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-sm text-white/80">Ready for instant payout</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-white/80">Pending Amount</h3>
                    <p className="text-4xl font-bold text-white">{formatCurrency(pendingAmount)}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-sm text-white/80">Processing (2-3 business days)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-green-600">+12.5%</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">This Month</h3>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(1250.50)}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-blue-600">47</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Sales</h3>
            <p className="text-2xl font-bold text-gray-900">This Month</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-purple-600">4.9</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Avg Rating</h3>
            <p className="text-2xl font-bold text-gray-900">From Buyers</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-orange-600">23</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Countries</h3>
            <p className="text-2xl font-bold text-gray-900">Reached</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Quick Actions</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Zap className="w-4 h-4" />
              <span>Fast & Secure</span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <button className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <CreditCard className="w-8 h-8" />
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
              <h4 className="text-lg font-bold mb-2">Request Payout</h4>
              <p className="text-blue-100 text-sm">Transfer funds to your bank account</p>
            </button>
            
            <button className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="w-8 h-8" />
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
              <h4 className="text-lg font-bold mb-2">View Analytics</h4>
              <p className="text-green-100 text-sm">Track your performance metrics</p>
            </button>
            
            <button className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <Shield className="w-8 h-8" />
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
              <h4 className="text-lg font-bold mb-2">Security Settings</h4>
              <p className="text-purple-100 text-sm">Manage your account security</p>
            </button>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Recent Transactions</h3>
                <p className="text-gray-600">Your latest financial activity</p>
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">
                <History className="w-4 h-4" />
                <span>View All</span>
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {transactions.map((transaction, index) => (
              <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                      transaction.type === 'sale' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                      transaction.type === 'payout' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                      'bg-gradient-to-br from-red-400 to-red-600'
                    }`}>
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {transaction.description}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{formatDate(transaction.date)}</span>
                        <span>•</span>
                        <span className="capitalize">{transaction.type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </p>
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payout Information */}
        <div className="mt-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-blue-900">Payout Information</h4>
              <p className="text-blue-700">Everything you need to know about getting paid</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <h5 className="font-semibold text-blue-900">Processing Time</h5>
                  <p className="text-sm text-blue-800">Payouts are processed automatically every 2-3 business days</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <DollarSign className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <h5 className="font-semibold text-blue-900">Minimum Amount</h5>
                  <p className="text-sm text-blue-800">Minimum payout amount: $10.00</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CreditCard className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <h5 className="font-semibold text-blue-900">Processing Fees</h5>
                  <p className="text-sm text-blue-800">2.9% + $0.30 per transaction</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <h5 className="font-semibold text-blue-900">Security</h5>
                  <p className="text-sm text-blue-800">Your funds are held securely with Stripe</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AppFooter />
      <BottomNav />
    </div>
  );
}
