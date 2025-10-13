'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, AlertCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MarketplaceService } from '@/services/marketplaceService';

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    try {
      const result = await MarketplaceService.getUserOrders(user.id, 'buyer');
      
      if (result.success && result.orders) {
        setOrders(result.orders);
      } else {
        console.error('Failed to load orders:', result.error);
      }
    } catch (error: any) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'confirmed':
        return 'text-blue-600 bg-blue-100';
      case 'processing':
        return 'text-purple-600 bg-purple-100';
      case 'shipped':
        return 'text-indigo-600 bg-indigo-100';
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'refunded':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} className="text-yellow-600" />;
      case 'confirmed':
        return <CheckCircle size={16} className="text-blue-600" />;
      case 'processing':
        return <Package size={16} className="text-purple-600" />;
      case 'shipped':
        return <Truck size={16} className="text-indigo-600" />;
      case 'delivered':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'cancelled':
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You must be logged in to view your orders.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">My Orders</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex space-x-1">
            {[
              { key: 'all', label: 'All Orders' },
              { key: 'pending', label: 'Pending' },
              { key: 'confirmed', label: 'Confirmed' },
              { key: 'processing', label: 'Processing' },
              { key: 'shipped', label: 'Shipped' },
              { key: 'delivered', label: 'Delivered' },
              { key: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Package size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all' 
                ? "You haven't placed any orders yet." 
                : `No orders with status "${filter}" found.`
              }
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Order #{order.order_number}</h3>
                      <p className="text-sm text-gray-500">Placed on {formatDate(order.order_date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">${order.total_amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">{order.quantity} item(s)</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center space-x-4">
                    {order.listing?.images && order.listing.images.length > 0 ? (
                      <img
                        src={order.listing.images[0]}
                        alt={order.listing.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Package size={24} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{order.listing?.title || 'Item'}</h4>
                      <p className="text-sm text-gray-500">
                        Seller: {order.seller?.name || 'Unknown Seller'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Quantity: {order.quantity} × ${order.unit_price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Actions */}
                <div className="border-t border-gray-200 pt-4 mt-4 flex items-center justify-between">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => router.push(`/order/${order.id}`)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => router.push(`/order/${order.id}/message`)}
                      className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center space-x-1"
                    >
                      <MessageSquare size={14} />
                      <span>Message Seller</span>
                    </button>
                  </div>

                  <div className="flex space-x-2">
                    {order.status === 'delivered' && (
                      <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
                        Leave Review
                      </button>
                    )}
                    {['pending', 'confirmed', 'processing'].includes(order.status) && (
                      <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm">
                        Cancel Order
                      </button>
                    )}
                    {order.status === 'shipped' && (
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                        Track Package
                      </button>
                    )}
                  </div>
                </div>

                {/* Delivery Information */}
                {order.delivery_method !== 'pickup' && order.delivery_address && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Delivery Address</h5>
                    <p className="text-sm text-gray-600">
                      {order.delivery_address.street}<br />
                      {order.delivery_address.city}, {order.delivery_address.state} {order.delivery_address.postal_code}
                    </p>
                  </div>
                )}

                {/* Tracking Information */}
                {order.tracking_number && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Tracking Information</h5>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Tracking Number:</span>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{order.tracking_number}</code>
                    </div>
                    {order.estimated_delivery && (
                      <p className="text-sm text-gray-600 mt-1">
                        Estimated Delivery: {formatDate(order.estimated_delivery)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
