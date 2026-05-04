import React, { useEffect, useState,useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import { getOrderById } from "@/services/api";
import { URLSearchParams } from "url";
import { da } from "zod/v4/locales";

type PaymentData = {
  decision: string,
  transactionId: string,
  referenceNumber: string,
  totalPrice: string,
  currency: string,
};

function useHashParams() {
  const hash = window.location.hash; 
  const queryIndex = hash.indexOf("?");

  if (queryIndex === -1) return new window.URLSearchParams();

  const queryString = hash.slice(queryIndex + 1); 
  return new window.URLSearchParams(queryString);
}


const PaymentSuccess = () => {
  const searchParams = useHashParams();
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderCreated, setOrderCreated] = useState(false);
  const clearCart = useCartStore.getState().clearCart;

  const hasRun = useRef(false);

  useEffect(() => {
    const checkStatus = async () => {
      // if (hasRun.current) return;
      // hasRun.current = true;
      
      const decision = searchParams.get("decision");
      const orderId = searchParams.get("orderId");
      if (!orderId) return;
      
      const savedDataRaw = sessionStorage.getItem("lastPaymentResult");
      if (savedDataRaw) {
        const savedData = JSON.parse(savedDataRaw);
        if (savedData.referenceNumber === orderId) {
          setPaymentData(savedData);
          setOrderCreated(true);
          setLoading(false);
          return;
        } else {
          // If IDs don't match, the user started a new order flow
          sessionStorage.removeItem("lastPaymentResult");
        }
      }

      try {
        // 1. Ask your backend for the order status
        const order = await getOrderById(orderId);

        if (order.status?.toLowerCase() === "completed") {
          setOrderCreated(true);
          const data = {
            decision: decision,
            transactionId: order.transactionId,
            referenceNumber: order.orderId,
            totalPrice: order.totalPrice ? order.totalPrice.toString() : "0.00",
            currency: order.currency,
          };
          setPaymentData(data);

          sessionStorage.setItem("lastPaymentResult", JSON.stringify(data));

          // 2. Clear UI state
          clearCart();
          useCartStore.persist.clearStorage();
          sessionStorage.removeItem("pendingOrderPayload");
          sessionStorage.removeItem("pendingOrder");

          // 3. Trigger confetti immediately
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#E53E3E", "#F6AD55", "#48BB78"],
          });

          toast.success("🎉 Payment Confirmed & Order Placed!");
        } else {
          toast.error("Order is still pending. Please wait...");
        }
      } catch (err) {
        toast.error("Could not verify order. Please contact support.");
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
    
  }, [searchParams, clearCart]);

  useEffect(() => {
    return () => {
      sessionStorage.removeItem("lastPaymentResult");
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Processing payment result...</p>
          <p className="text-sm text-gray-400 mt-2">Please don't close this window</p>
        </div>
      </div>
    );
  }

  const isSuccess = paymentData?.decision === "ACCEPT";
  const isDeclined = paymentData?.decision === "DECLINE";
  const isError = paymentData?.decision === "ERROR";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
        <div className="text-center">
          {isSuccess && (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 animate-in zoom-in duration-300">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-3">Payment Successful! 🎉</h1>
              <p className="text-gray-600 mb-6 text-lg">
                {orderCreated ? "Your order has been confirmed and is being prepared" : "Payment processed successfully"}
              </p>
            </>
          )}
          {isDeclined && (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6 animate-in zoom-in duration-300">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-3">Payment Declined</h1>
              <p className="text-gray-600 mb-6 text-lg">
                Your payment could not be processed. Please try again or use a different payment method.
              </p>
            </>
          )}
          {isError && (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6 animate-in zoom-in duration-300">
                <XCircle className="w-12 h-12 text-yellow-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-3">Payment Error</h1>
              <p className="text-gray-600 mb-6 text-lg">An error occurred while processing your payment. Please contact support.</p>
            </>
          )}

          {/* Transaction Details */}
          <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mb-6 text-left">
            <h3 className="text-center text-sm font-semibold text-gray-700 mb-4">Transaction Details</h3>
            <div className="space-y-3">

              {paymentData?.transactionId && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                  <span className="text-sm text-gray-600 shrink-0">Transaction ID:</span>
                  <span className="text-sm font-mono text-gray-800 bg-white px-2 py-1 rounded break-all sm:text-right">
                    {paymentData.transactionId}
                  </span>
                </div>
              )}

              {paymentData?.referenceNumber && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                  <span className="text-sm text-gray-600 shrink-0">Order ID:</span>
                  <span className="text-sm font-mono text-gray-800 bg-white px-2 py-1 rounded break-all sm:text-right">
                    {paymentData.referenceNumber.toUpperCase().slice(7, )}
                  </span>
                </div>
              )}

              {paymentData?.totalPrice && (
                <div className="flex justify-between items-center gap-2">
                  <span className="text-sm text-gray-600 shrink-0">Amount:</span>
                  <span className="text-sm font-semibold text-gray-800 text-right px-2">
                    {paymentData.currency} {paymentData.totalPrice}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center gap-2">
                <span className="text-sm text-gray-600 shrink-0">Status:</span>
                <span
                  className={`text-sm font-semibold px-2 py-1 rounded-full text-right ${
                    isSuccess
                      ? "bg-green-100 text-green-700"
                      : isDeclined
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {paymentData?.decision}
                </span>
              </div>

            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {isSuccess ? (
              <>
                <Button onClick={() => navigate("/menu")} variant="outline" className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2">
                  Continue Shopping
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => navigate("/cart")} className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-3 rounded-xl font-semibold">
                  Try Again
                </Button>
                <Button onClick={() => navigate("/menu")} variant="outline" className="w-full py-3 rounded-xl font-semibold">
                  Back to Menu
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;