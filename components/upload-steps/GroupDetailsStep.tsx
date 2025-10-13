'use client'

import { useState } from 'react'
import { Users, Lock, Globe, DollarSign, Shield, MessageSquare } from 'lucide-react'

interface GroupDetailsStepProps {
  data: Partial<any>
  onChange: (data: Partial<any>) => void
}

export default function GroupDetailsStep({ data, onChange }: GroupDetailsStepProps) {
  const [groupType, setGroupType] = useState(data.groupType || 'free')
  const [privacy, setPrivacy] = useState(data.privacy || 'public')
  const [membershipFee, setMembershipFee] = useState(data.membershipFee || '')
  const [currency, setCurrency] = useState(data.currency || 'EUR')
  const [billingPeriod, setBillingPeriod] = useState(data.billingPeriod || 'monthly')
  const [requiresApproval, setRequiresApproval] = useState(data.requiresApproval || false)
  const [maxMembers, setMaxMembers] = useState(data.maxMembers || '')
  const [allowDiscussions, setAllowDiscussions] = useState(data.allowDiscussions !== false)

  const currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD (C$)' },
    { value: 'AUD', label: 'AUD (A$)' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Group / Community Details
        </h3>
        <p className="text-gray-600">
          Configure your group settings and membership options
        </p>
      </div>

      {/* Group Type */}
      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Users className="w-6 h-6 text-teal-600 mr-2" />
          <h4 className="font-semibold text-teal-900">Membership Type</h4>
        </div>

        <div className="space-y-3">
          <label className="flex items-start p-4 border-2 border-teal-200 rounded-lg cursor-pointer hover:bg-white transition-colors">
            <input
              type="radio"
              name="groupType"
              value="free"
              checked={groupType === 'free'}
              onChange={(e) => {
                setGroupType(e.target.value)
                onChange({ groupType: e.target.value })
              }}
              className="mt-1 rounded-full border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <div className="ml-3 flex-1">
              <div className="font-medium text-teal-900">Free Group</div>
              <div className="text-sm text-teal-700 mt-1">
                Anyone can join without payment. Great for communities and public forums.
              </div>
            </div>
          </label>

          <label className="flex items-start p-4 border-2 border-teal-200 rounded-lg cursor-pointer hover:bg-white transition-colors">
            <input
              type="radio"
              name="groupType"
              value="paid"
              checked={groupType === 'paid'}
              onChange={(e) => {
                setGroupType(e.target.value)
                onChange({ groupType: e.target.value })
              }}
              className="mt-1 rounded-full border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <div className="ml-3 flex-1">
              <div className="font-medium text-teal-900">Paid Membership</div>
              <div className="text-sm text-teal-700 mt-1">
                Members pay a recurring fee to access exclusive content and discussions.
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Paid Membership Options */}
      {groupType === 'paid' && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <DollarSign className="w-6 h-6 text-green-600 mr-2" />
            <h4 className="font-semibold text-green-900">Pricing & Billing</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Membership Fee *
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={membershipFee}
                  onChange={(e) => {
                    setMembershipFee(e.target.value)
                    onChange({ membershipFee: parseFloat(e.target.value) || 0 })
                  }}
                  placeholder="9.99"
                  min="0"
                  step="0.01"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <select
                  value={currency}
                  onChange={(e) => {
                    setCurrency(e.target.value)
                    onChange({ currency: e.target.value })
                  }}
                  className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {currencies.map(curr => (
                    <option key={curr.value} value={curr.value}>
                      {curr.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Billing Period *
              </label>
              <select
                value={billingPeriod}
                onChange={(e) => {
                  setBillingPeriod(e.target.value)
                  onChange({ billingPeriod: e.target.value })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="lifetime">Lifetime Access</option>
              </select>
            </div>
          </div>

          <div className="mt-4 p-3 bg-green-100 rounded-lg">
            <p className="text-sm text-green-800">
              💰 <strong>Estimated:</strong> {membershipFee} {currency} / {billingPeriod}
            </p>
          </div>
        </div>
      )}

      {/* Privacy Settings */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Shield className="w-6 h-6 text-purple-600 mr-2" />
          <h4 className="font-semibold text-purple-900">Privacy & Access</h4>
        </div>

        <div className="space-y-3">
          <label className="flex items-start p-4 border-2 border-purple-200 rounded-lg cursor-pointer hover:bg-white transition-colors">
            <input
              type="radio"
              name="privacy"
              value="public"
              checked={privacy === 'public'}
              onChange={(e) => {
                setPrivacy(e.target.value)
                onChange({ privacy: e.target.value })
              }}
              className="mt-1 rounded-full border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <div className="ml-3 flex-1">
              <div className="flex items-center">
                <Globe className="w-4 h-4 text-purple-600 mr-2" />
                <div className="font-medium text-purple-900">Public Group</div>
              </div>
              <div className="text-sm text-purple-700 mt-1">
                Anyone can find and view this group. {groupType === 'paid' ? 'Payment required to join.' : 'Anyone can join.'}
              </div>
            </div>
          </label>

          <label className="flex items-start p-4 border-2 border-purple-200 rounded-lg cursor-pointer hover:bg-white transition-colors">
            <input
              type="radio"
              name="privacy"
              value="private"
              checked={privacy === 'private'}
              onChange={(e) => {
                setPrivacy(e.target.value)
                onChange({ privacy: e.target.value })
              }}
              className="mt-1 rounded-full border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <div className="ml-3 flex-1">
              <div className="flex items-center">
                <Lock className="w-4 h-4 text-purple-600 mr-2" />
                <div className="font-medium text-purple-900">Private Group</div>
              </div>
              <div className="text-sm text-purple-700 mt-1">
                Only invited members can join and view content. Requires approval.
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Group Settings */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <MessageSquare className="w-6 h-6 text-blue-600 mr-2" />
          <h4 className="font-semibold text-blue-900">Group Settings</h4>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Members (optional)
            </label>
            <input
              type="number"
              value={maxMembers}
              onChange={(e) => {
                setMaxMembers(e.target.value)
                onChange({ maxMembers: parseInt(e.target.value) || undefined })
              }}
              placeholder="Unlimited"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={requiresApproval}
              onChange={(e) => {
                setRequiresApproval(e.target.checked)
                onChange({ requiresApproval: e.target.checked })
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Require admin approval for new members
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={allowDiscussions}
              onChange={(e) => {
                setAllowDiscussions(e.target.checked)
                onChange({ allowDiscussions: e.target.checked })
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Enable discussion forums and posts
            </span>
          </label>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-medium text-amber-900 mb-2">💡 Group Features</h4>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Members can post and discuss in your group</li>
          <li>• You can moderate content and manage members</li>
          <li>• Set rules and guidelines for your community</li>
          <li>• Share exclusive content with members</li>
          {groupType === 'paid' && <li>• Earn recurring revenue from memberships</li>}
        </ul>
      </div>
    </div>
  )
}

