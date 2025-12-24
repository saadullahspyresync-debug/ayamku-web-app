
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import { placeOrder } from "@/services/api";

const PaymentFailure = () => {




  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
        <div className="text-center">
   
      
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6 animate-in zoom-in duration-300">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-3">
                Payment Declined
              </h1>
              <p className="text-gray-600 mb-6 text-lg">
                Your payment could not be processed. Please try again or use a
                different payment method.
              </p>
            </>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;