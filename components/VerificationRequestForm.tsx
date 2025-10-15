'use client';

import { useState, useEffect } from 'react';
import { verificationService, type VerificationRequest } from '@/services/verificationService';

export default function VerificationRequestForm({ userId }: { userId: string }) {
  const [step, setStep] = useState(1);
  const [verificationType, setVerificationType] = useState<'individual' | 'business' | 'creator' | 'enterprise'>('individual');
  const [formData, setFormData] = useState<Partial<VerificationRequest>>({});
  const [documents, setDocuments] = useState<{
    idDocument?: File;
    businessLicense?: File;
    proofOfAddress?: File;
  }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<any>(null);

  useEffect(() => {
    loadCurrentStatus();
  }, [userId]);

  const loadCurrentStatus = async () => {
    const { data } = await verificationService.getVerificationStatus(userId);
    setCurrentStatus(data);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    const result = await verificationService.submitVerificationRequest(
      userId,
      {
        verificationType,
        ...formData
      } as VerificationRequest,
      documents
    );

    setLoading(false);

    if (result.success) {
      setSuccess(true);
    } else {
      setError('Failed to submit verification request. Please try again.');
    }
  };

  if (currentStatus?.verification_status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h3 className="text-xl font-bold mb-2">Verification Pending</h3>
          <p className="text-gray-600">
            Your verification request is being reviewed. We'll notify you once it's processed.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Submitted: {new Date(currentStatus.submitted_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  }

  if (currentStatus?.verification_status === 'verified') {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-green-50 border border-green-200 rounded-xl">
        <div className="text-center">
          <div className="text-6xl mb-4">✓</div>
          <h3 className="text-xl font-bold text-green-600 mb-2">Verified!</h3>
          <p className="text-gray-600">
            Your account is verified as {currentStatus.verification_level}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Verified on: {new Date(currentStatus.verified_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-green-50 border border-green-200 rounded-xl">
        <div className="text-center">
          <div className="text-6xl mb-4">✓</div>
          <h3 className="text-xl font-bold mb-2">Request Submitted!</h3>
          <p className="text-gray-600">
            Your verification request has been submitted successfully. We'll review it and get back to you soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Get Verified</h2>
        <p className="text-gray-600">
          Get a verified badge on your profile to build trust with the community
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div className={`w-20 h-1 ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Step 1: Choose Type */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">Choose Verification Type</h3>
          
          <button
            onClick={() => setVerificationType('individual')}
            className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
              verificationType === 'individual'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">👤</div>
              <div>
                <h4 className="font-bold text-lg mb-1">Individual</h4>
                <p className="text-sm text-gray-600">
                  For personal accounts. Verify your identity with government ID.
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setVerificationType('business')}
            className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
              verificationType === 'business'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">🏢</div>
              <div>
                <h4 className="font-bold text-lg mb-1">Business</h4>
                <p className="text-sm text-gray-600">
                  For registered businesses. Requires business license and registration.
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setVerificationType('creator')}
            className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
              verificationType === 'creator'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">⭐</div>
              <div>
                <h4 className="font-bold text-lg mb-1">Creator</h4>
                <p className="text-sm text-gray-600">
                  For content creators and influencers. Verify your identity and social presence.
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setVerificationType('enterprise')}
            className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
              verificationType === 'enterprise'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">🏆</div>
              <div>
                <h4 className="font-bold text-lg mb-1">Enterprise</h4>
                <p className="text-sm text-gray-600">
                  For large organizations. Premium verification with dedicated support.
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setStep(2)}
            className="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Information */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">
            {verificationType === 'business' ? 'Business Information' : 'Personal Information'}
          </h3>

          {verificationType !== 'business' ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Full Legal Name *</label>
                <input
                  type="text"
                  value={formData.fullName || ''}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date of Birth *</label>
                <input
                  type="date"
                  value={formData.dateOfBirth || ''}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Government ID Type *</label>
                <select
                  value={formData.governmentIdType || ''}
                  onChange={(e) => setFormData({ ...formData, governmentIdType: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                  required
                >
                  <option value="">Select ID Type</option>
                  <option value="passport">Passport</option>
                  <option value="drivers_license">Driver's License</option>
                  <option value="national_id">National ID Card</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Business Name *</label>
                <input
                  type="text"
                  value={formData.businessName || ''}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Registration Number *</label>
                <input
                  type="text"
                  value={formData.businessRegistrationNumber || ''}
                  onChange={(e) => setFormData({ ...formData, businessRegistrationNumber: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Business Type *</label>
                <select
                  value={formData.businessType || ''}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="sole_proprietorship">Sole Proprietorship</option>
                  <option value="partnership">Partnership</option>
                  <option value="llc">LLC</option>
                  <option value="corporation">Corporation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Business Website</label>
                <input
                  type="url"
                  value={formData.businessWebsite || ''}
                  onChange={(e) => setFormData({ ...formData, businessWebsite: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tax ID / EIN</label>
                <input
                  type="text"
                  value={formData.taxId || ''}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Phone Number *</label>
            <input
              type="tel"
              value={formData.phoneNumber || ''}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full p-3 border rounded-lg"
              placeholder="+1 (555) 000-0000"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Documents */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">Upload Documents</h3>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <strong>Important:</strong> All documents should be clear, legible, and valid. We accept PDF, JPG, or PNG files.
          </div>

          {verificationType !== 'business' ? (
            <div>
              <label className="block text-sm font-medium mb-2">Government ID Document *</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setDocuments({ ...documents, idDocument: e.target.files?.[0] })}
                className="w-full p-3 border rounded-lg"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Upload a scan or photo of your {formData.governmentIdType}</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Business License *</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setDocuments({ ...documents, businessLicense: e.target.files?.[0] })}
                  className="w-full p-3 border rounded-lg"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Upload your business license or registration certificate</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Proof of Address</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setDocuments({ ...documents, proofOfAddress: e.target.files?.[0] })}
                  className="w-full p-3 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Utility bill or bank statement (last 3 months)</p>
              </div>
            </>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

