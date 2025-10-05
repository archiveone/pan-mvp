'use client';

import React, { useState } from 'react';
import { Shield, ShieldCheck, ShieldX, Clock, AlertCircle } from 'lucide-react';
import VerificationModal from './VerificationModal';

interface VerificationBadgeProps {
  verificationStatus: string;
  verificationLevel: string;
  onVerificationUpdate?: () => void;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({ 
  verificationStatus, 
  verificationLevel,
  onVerificationUpdate 
}) => {
  const [showVerification, setShowVerification] = useState(false);

  const getVerificationInfo = () => {
    switch (verificationStatus) {
      case 'verified':
        return {
          icon: <ShieldCheck size={16} />,
          text: 'Verified',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200'
        };
      case 'pending':
        return {
          icon: <Clock size={16} />,
          text: 'Pending',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-200'
        };
      case 'rejected':
        return {
          icon: <ShieldX size={16} />,
          text: 'Rejected',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: <Shield size={16} />,
          text: 'Unverified',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200'
        };
    }
  };

  const verificationInfo = getVerificationInfo();

  const handleVerifyClick = () => {
    if (verificationStatus === 'unverified') {
      setShowVerification(true);
    }
  };

  return (
    <>
      <div 
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium cursor-pointer transition-colors ${verificationInfo.bgColor} ${verificationInfo.borderColor} ${verificationInfo.color} hover:opacity-80`}
        onClick={handleVerifyClick}
      >
        {verificationInfo.icon}
        <span>{verificationInfo.text}</span>
        {verificationLevel && verificationLevel !== 'none' && (
          <span className="text-xs opacity-75">({verificationLevel})</span>
        )}
      </div>

      {/* Verification Modal */}
      {showVerification && (
        <VerificationModal
          isOpen={showVerification}
          onClose={() => setShowVerification(false)}
          onSuccess={() => {
            console.log('Verification started!');
            setShowVerification(false);
            onVerificationUpdate?.();
          }}
        />
      )}
    </>
  );
};

export default VerificationBadge;
