import React, { useState } from "react";
import { X, CreditCard, Loader2, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";

interface PaymentFormProps {
  amount: number;
  currency?: string;
  // onPaymentSuccess: () => void;
  onClose: () => void;
}

// ✅ HELPER FUNCTION: To perform the POST redirect
function postToCybersource(url: string, data: { [key: string]: string }) {

  // Create a new form element
  const form = document.createElement("form");
  form.method = "post";
  form.action = url;

  // Add hidden input fields for each parameter
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const hiddenField = document.createElement("input");
      hiddenField.type = "hidden";
      hiddenField.name = key;
      hiddenField.value = data[key];
      form.appendChild(hiddenField);
    }
  }

  // Append the form to the body and submit it
  document.body.appendChild(form);
  form.submit();
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  currency = "BND",
  // onPaymentSuccess,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const handleSecurePayment = async () => {
    try {
      setLoading(true);
      setError("");

      const orderId = `ORDER-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // 1. Call your backend to get the signed parameters
      const { data } = await api.post("/secure-acceptance", {
        amount: amount.toFixed(2),
        currency,
        orderId,
      });

      // Store order details in sessionStorage for when user returns
      sessionStorage.setItem(
        "pendingOrder",
        JSON.stringify({
          orderId,
          amount,
          currency,
          timestamp: Date.now(),
        })
      );

      // 2. ✅ Use the helper function to POST the data to CyberSource
      postToCybersource(data.paymentUrl, data.params);
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message || "Failed to initiate payment");
      setLoading(false);
    }
  };

  // ... (The rest of your JSX remains the same)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Secure Payment
          </h2>
          <p className="text-gray-600">Complete your order with CyberSource</p>
        </div>

        {/* Amount Display */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 mb-6 border-2 border-red-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total Amount</p>
            <p className="text-4xl font-bold text-red-600">
              ${amount.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{currency}</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Button */}
        <Button
          onClick={handleSecurePayment}
          disabled={loading}
          className=" w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Redirecting to Payment...</span>
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              <span>Continue to Secure Payment</span>
            </>
          )}
        </Button>

        {/* Security Note */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-600 leading-relaxed">
                Your payment is processed securely by{" "}
                <strong>CyberSource</strong>, a Visa company. Your card
                information is never stored on our servers.
              </p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            What happens next:
          </h3>
          <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
            <li>You'll be redirected to CyberSource's secure payment page</li>
            <li>Enter your card details safely on their platform</li>
            <li>Complete the payment and return automatically</li>
            <li>Your order will be confirmed instantly</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;
