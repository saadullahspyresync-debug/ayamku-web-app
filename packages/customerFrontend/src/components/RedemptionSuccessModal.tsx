// src/components/RedemptionSuccessModal.tsx
import React from "react";
import { CheckCircle, X, Copy, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";

interface RedemptionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  redemption: {
    redemptionId: string;
    redeemableName: string;
    pointsCost: number;
    branchId?: string;
    expiresAt?: number;
  } | null;
  newBalance: number;
}

const RedemptionSuccessModal: React.FC<RedemptionSuccessModalProps> = ({
  isOpen,
  onClose,
  redemption,
  newBalance,
}) => {
  if (!isOpen || !redemption) return null;

  const copyCode = () => {
    navigator.clipboard.writeText(redemption.redemptionId);
    toast.success("Redemption code copied!");
  };

  const expiryDate = redemption.expiresAt
    ? new Date(redemption.expiresAt).toLocaleDateString()
    : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slideUp">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-scaleIn">
            <CheckCircle className="text-green-600" size={48} />
          </div>
        </div>

        {/* Success Message */}
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">
          Redemption Successful!
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Your {redemption.redeemableName} has been redeemed
        </p>

        {/* Redemption Code Box */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 text-center mb-2">
            Your Redemption Code
          </p>
          <div className="flex items-center justify-center gap-3">
            <code className="text-2xl font-bold text-red-600 tracking-wider">
              {redemption.redemptionId.slice(0, 12)}
            </code>
            <button
              onClick={copyCode}
              className="p-2 hover:bg-white rounded-lg transition-colors"
              title="Copy code"
            >
              <Copy size={20} className="text-red-600" />
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">How to Claim:</h3>
          <ol className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start">
              <span className="font-bold mr-2">1.</span>
              <span>Visit any {redemption.branchId === "all" ? "branch" : "designated branch"}</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">2.</span>
              <span>Show this code to the staff</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">3.</span>
              <span>Enjoy your {redemption.redeemableName}!</span>
            </li>
          </ol>
        </div>

        {/* Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Points Used:</span>
            <span className="font-bold text-red-600">
              {redemption.pointsCost} pts
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Remaining Balance:</span>
            <span className="font-bold text-green-600">
              {newBalance.toLocaleString()} pts
            </span>
          </div>
          {expiryDate && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={16} />
              <span>Valid until {expiryDate}</span>
            </div>
          )}
          {redemption.branchId === "all" && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <MapPin size={16} />
              <span>Redeemable at all branches</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-colors"
          >
            Done
          </button>
          <button
            onClick={() => {
              // Navigate to redemption history
              onClose();
              window.location.href = "/profile?tab=points";
            }}
            className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold transition-colors"
          >
            View My Redemptions
          </button>
        </div>
      </div>
    </div>
  );
};

export default RedemptionSuccessModal;

// ============================================
// CSS Animations (Add to your global CSS or Tailwind config)
// ============================================

/*
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}

.animate-slideUp {
  animation: slideUp 0.3s ease-out;
}

.animate-scaleIn {
  animation: scaleIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
*/