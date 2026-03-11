
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import { placeOrder } from "@/services/api";

function useHashParams() {
  const hash = window.location.hash; 
  const queryIndex = hash.indexOf("?");

  if (queryIndex === -1) return new window.URLSearchParams();

  const queryString = hash.slice(queryIndex + 1); 
  return new window.URLSearchParams(queryString);
}

const PaymentFailure = () => {
  const searchParams = useHashParams();
  const navigate = useNavigate();

  const orderId = searchParams.get("orderId");
  const reason = searchParams.get("reason");
  const code = searchParams.get("code");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
        <div className="text-center">     
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6 animate-in zoom-in duration-300">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-3">
                {reason && reason === "The consumer cancelled the transaction" ? "Payment Canceled" : "Payment Error"}
              </h1>
              <p className="text-gray-600 mb-6 text-lg">
                Your payment could not be processed. 
                { reason && <span> {reason}</span>}.
              </p>
            </>
        </div>

        <div className="space-y-3">
            <>
              <Button onClick={() => navigate("/menu")} variant="outline" className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2">
                Continue Shopping
                <ArrowRight className="w-5 h-5" />
              </Button>
            </>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;