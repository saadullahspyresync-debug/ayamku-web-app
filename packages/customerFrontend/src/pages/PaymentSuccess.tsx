// // src/pages/PaymentSuccess.tsx
// import React, { useEffect, useState } from "react";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import confetti from "canvas-confetti";
// import { useCartStore } from "@/store/cartStore";
// import { toast } from "sonner";
// import { placeOrder } from "@/services/api";

// const PaymentSuccess = () => {
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const [paymentData, setPaymentData] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const { clearCart } = useCartStore();

//   // useEffect(() => {
//   //   // Parse URL parameters sent back by CyberSource
//   //   const decision = searchParams.get('decision');
//   //   const transactionId = searchParams.get('transaction_id');
//   //   const reasonCode = searchParams.get('reason_code');
//   //   const referenceNumber = searchParams.get('req_reference_number');
//   //   const amount = searchParams.get('req_amount');
//   //   const currency = searchParams.get('req_currency');
//   //   const authCode = searchParams.get('auth_code');
//   //   const message = searchParams.get('message');

//   //   const data = {
//   //     decision,
//   //     transactionId,
//   //     reasonCode,
//   //     referenceNumber,
//   //     amount,
//   //     currency,
//   //     authCode,
//   //     message,
//   //   };

//   //   setPaymentData(data);
//   //   setLoading(false);

//   //   // If payment was successful, trigger confetti and clear cart
//   //   if (decision === 'ACCEPT') {
//   //     confetti({
//   //       particleCount: 150,
//   //       spread: 80,
//   //       origin: { y: 0.6 },
//   //       colors: ['#E53E3E', '#F6AD55', '#48BB78'],
//   //     });

//   //     // Clear the cart after successful payment
//   //     setTimeout(() => {
//   //       clearCart();
//   //     }, 1000);
//   //   }

//   //   // Clean up pending order from sessionStorage
//   //   sessionStorage.removeItem('pendingOrder');
//   // }, [searchParams, clearCart]);

//   useEffect(() => {
//     // This function will run once on component mount
//     const processPayment = async () => {
//       // Parse URL parameters sent back by CyberSource
//       const decision = searchParams.get("decision");
//       const transactionId = searchParams.get("transaction_id");
//       const referenceNumber = searchParams.get("req_reference_number");
//       // ... get other params

//       const paymentResult = {
//         decision,
//         transactionId,
//         referenceNumber /* ... */,
//       };
//       setPaymentData(paymentResult);

//       // If payment was successful, create the order in the database
//       if (decision === "ACCEPT") {
//         confetti({
//           /* ... */
//         });

//         try {
//           // 1. Retrieve the saved order details
//           const pendingOrderPayloadJSON = sessionStorage.getItem(
//             "pendingOrderPayload"
//           );
//           if (!pendingOrderPayloadJSON) {
//             throw new Error(
//               "No pending order found. Your session may have expired."
//             );
//           }
//           const orderPayload = JSON.parse(pendingOrderPayloadJSON);

//           // 2. Verify the reference number matches
//           if (orderPayload.referenceNumber !== referenceNumber) {
//             throw new Error("Order ID mismatch. Please contact support.");
//           }

//           // 3. ✅ Call your placeOrder API with the final details
//           await placeOrder({
//             ...orderPayload,
//             paymentMethod: "cybersource",
//             paymentStatus: "Paid",
//             transactionId: transactionId,
//             paymentDetails: paymentResult, // Optional: store the full response
//           });

//           toast.success("🎉 Order placed successfully!");

//           // 4. Clear the cart and pending order info
//           clearCart();
//           sessionStorage.removeItem("pendingOrderPayload");
//         } catch (error: any) {
//           console.error("Failed to place order after payment:", error);
//           toast.error(
//             error.message ||
//               "There was an issue creating your order. Please contact support."
//           );
//         }
//       } else {
//         // If payment failed, just clean up
//         sessionStorage.removeItem("pendingOrderPayload");
//       }

//       setLoading(false);
//     };

//     processPayment();
//   }, [searchParams, clearCart]);
//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <Loader2 className="w-12 h-12 animate-spin text-red-500 mx-auto mb-4" />
//           <p className="text-gray-600">Processing payment result...</p>
//         </div>
//       </div>
//     );
//   }

//   const isSuccess = paymentData.decision === "ACCEPT";
//   const isDeclined = paymentData.decision === "DECLINE";
//   const isError = paymentData.decision === "ERROR";

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
//       <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
//         <div className="text-center">
//           {/* Success State */}
//           {isSuccess && (
//             <>
//               <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 animate-in zoom-in duration-300">
//                 <CheckCircle className="w-12 h-12 text-green-600" />
//               </div>
//               <h1 className="text-3xl font-bold text-gray-800 mb-3">
//                 Payment Successful! 🎉
//               </h1>
//               <p className="text-gray-600 mb-6 text-lg">
//                 Your payment has been processed successfully
//               </p>
//             </>
//           )}

//           {/* Declined State */}
//           {isDeclined && (
//             <>
//               <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6 animate-in zoom-in duration-300">
//                 <XCircle className="w-12 h-12 text-red-600" />
//               </div>
//               <h1 className="text-3xl font-bold text-gray-800 mb-3">
//                 Payment Declined
//               </h1>
//               <p className="text-gray-600 mb-6 text-lg">
//                 Unfortunately, your payment could not be processed
//               </p>
//             </>
//           )}

//           {/* Error State */}
//           {isError && (
//             <>
//               <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6 animate-in zoom-in duration-300">
//                 <XCircle className="w-12 h-12 text-yellow-600" />
//               </div>
//               <h1 className="text-3xl font-bold text-gray-800 mb-3">
//                 Payment Error
//               </h1>
//               <p className="text-gray-600 mb-6 text-lg">
//                 An error occurred while processing your payment
//               </p>
//             </>
//           )}

//           {/* Payment Details */}
//           <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
//             <h3 className="text-sm font-semibold text-gray-700 mb-4">
//               Transaction Details
//             </h3>
//             <div className="space-y-3">
//               {paymentData.transactionId && (
//                 <div className="flex justify-between items-center">
//                   <span className="text-sm text-gray-600">Transaction ID:</span>
//                   <span className="text-sm font-mono text-gray-800 bg-white px-2 py-1 rounded">
//                     {paymentData.transactionId}
//                   </span>
//                 </div>
//               )}
//               {paymentData.referenceNumber && (
//                 <div className="flex justify-between items-center">
//                   <span className="text-sm text-gray-600">Order ID:</span>
//                   <span className="text-sm font-mono text-gray-800 bg-white px-2 py-1 rounded">
//                     {paymentData.referenceNumber}
//                   </span>
//                 </div>
//               )}
//               {paymentData.amount && (
//                 <div className="flex justify-between items-center">
//                   <span className="text-sm text-gray-600">Amount:</span>
//                   <span className="text-sm font-semibold text-gray-800">
//                     {paymentData.currency} ${paymentData.amount}
//                   </span>
//                 </div>
//               )}
//               <div className="flex justify-between items-center">
//                 <span className="text-sm text-gray-600">Status:</span>
//                 <span
//                   className={`text-sm font-semibold px-3 py-1 rounded-full ${
//                     isSuccess
//                       ? "bg-green-100 text-green-700"
//                       : isDeclined
//                       ? "bg-red-100 text-red-700"
//                       : "bg-yellow-100 text-yellow-700"
//                   }`}
//                 >
//                   {paymentData.decision}
//                 </span>
//               </div>
//               {paymentData.authCode && (
//                 <div className="flex justify-between items-center">
//                   <span className="text-sm text-gray-600">Auth Code:</span>
//                   <span className="text-sm font-mono text-gray-800 bg-white px-2 py-1 rounded">
//                     {paymentData.authCode}
//                   </span>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Message from CyberSource */}
//           {paymentData.message && (
//             <div
//               className={`rounded-lg p-4 mb-6 ${
//                 isSuccess
//                   ? "bg-green-50 border border-green-200"
//                   : "bg-red-50 border border-red-200"
//               }`}
//             >
//               <p
//                 className={`text-sm ${
//                   isSuccess ? "text-green-800" : "text-red-800"
//                 }`}
//               >
//                 {paymentData.message}
//               </p>
//             </div>
//           )}

//           {/* Action Buttons */}
//           <div className="space-y-3">
//             {isSuccess ? (
//               <>
//                 <Button
//                   onClick={() => navigate("/orders")}
//                   className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2"
//                 >
//                   <span>View My Orders</span>
//                   <ArrowRight className="w-5 h-5" />
//                 </Button>
//                 <Button
//                   onClick={() => navigate("/menu")}
//                   variant="outline"
//                   className="w-full py-3 rounded-xl font-semibold"
//                 >
//                   Continue Shopping
//                 </Button>
//               </>
//             ) : (
//               <>
//                 <Button
//                   onClick={() => navigate("/cart")}
//                   className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-3 rounded-xl font-semibold"
//                 >
//                   Try Again
//                 </Button>
//                 <Button
//                   onClick={() => navigate("/menu")}
//                   variant="outline"
//                   className="w-full py-3 rounded-xl font-semibold"
//                 >
//                   Back to Menu
//                 </Button>
//               </>
//             )}
//           </div>

//           {/* Help Text */}
//           {!isSuccess && (
//             <p className="text-xs text-gray-500 mt-6">
//               Need help? Contact our support team at{" "}
//               <a
//                 href="mailto:support@ayamkubrunei.com"
//                 className="text-red-600 hover:underline"
//               >
//                 support@ayamkubrunei.com
//               </a>
//             </p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PaymentSuccess;
// src/pages/PaymentSuccess.tsx



import React, { useEffect, useState,useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import { placeOrder } from "@/services/api";
import { URLSearchParams } from "url";
import { useBranchStore } from "@/store/branchStore";

type PaymentData = {
  decision: string,
  transactionId: string,
  referenceNumber: string,
  amount: string,
  currency: string,
  authCode: string,
  message: string,
  reasonCode: string,
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
  const cartItems = useCartStore.getState().items;
  const arrivalTime = useCartStore.getState().arrivalTime;
  const specialInstructions = useCartStore.getState().specialInstruction;
  const orderType = useCartStore.getState().typeOfOrder;
  const branchId = useBranchStore.getState().selectedBranch?.branchId;

  const hasRun = useRef(false);
    useEffect(() => {
      if (hasRun.current) return;
      hasRun.current = true;
      const processPayment = async () => {


      try {
        // 1. Parse query params from hash
        const decision = searchParams.get("decision");
        const transactionId = searchParams.get("transactionId") || searchParams.get("transaction_id");
        const referenceNumber = searchParams.get("orderId") || searchParams.get("req_reference_number");
        const amount = searchParams.get("amount") || searchParams.get("req_amount");
        const currency = searchParams.get("currency") || searchParams.get("req_currency");
        const authCode = searchParams.get("auth_code");
        const message = searchParams.get("message");
        const reasonCode = searchParams.get("reason_code");

        const paymentResult = {
          decision,
          transactionId,
          referenceNumber,
          amount,
          currency,
          authCode,
          message,
          reasonCode,
        };

        setPaymentData(paymentResult);

        // 2. If payment was successful, create the order in the database
        if (decision === "ACCEPT") {         

          try {
            // 3. Retrieve pending order details from sessionStorage
            const pendingOrderPayloadJSON = sessionStorage.getItem("pendingOrder");
            
            if (!pendingOrderPayloadJSON) {
              console.error("No pending order found in sessionStorage");
              toast.error("Your session expired. Please try placing the order again.");
              setLoading(false);
              return;
            }

            const orderPayload = JSON.parse(pendingOrderPayloadJSON);

            // 4. Verify reference number matches
            if (orderPayload.orderId !== referenceNumber) {
              console.error("Order ID mismatch:", orderPayload.orderId, "vs", referenceNumber);
              toast.error("Order verification failed. Please contact support.");
              setLoading(false);
              return;
            }
            
            // 5. Call placeOrder API
            const orderResponse = {
              orderId: orderPayload.orderId,
              userId: orderPayload?.userId,
              items: cartItems,
              totalPrice: orderPayload.amount,
              paymentMethod: "cybersource",
              status: "Paid",
              createdAt: orderPayload.timestamp,
              updatedAt: Date.now(),
              orderType: orderType,
              branchId: branchId,
              specialInstructions: specialInstructions,
              scheduledTime: arrivalTime
            };
            
            const res = await placeOrder(orderResponse);
            setOrderCreated(true);

            toast.success("🎉 Order placed successfully!", {
              description: "Your order has been confirmed and payment received.",
            });

            // Trigger confetti immediately
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 },
              colors: ["#E53E3E", "#F6AD55", "#48BB78"],
            });
            
            // 6. Clear cart and pending order
            clearCart();
            useCartStore.persist.clearStorage()
            sessionStorage.removeItem("pendingOrderPayload");
            sessionStorage.removeItem("pendingOrder");

          } catch (error) {
            console.error("Failed to place order after payment:", error);
            toast.error(
              error.message ||
                "Failed to create your order. Please contact support with your transaction ID: " +
                  transactionId
            );
          } 
        

        } else {
          // Payment failed or declined
          sessionStorage.removeItem("pendingOrderPayload");

          if (decision === "DECLINE") {
            toast.error("Payment was declined by your bank.");
          } else if (decision === "ERROR") {
            toast.error("An error occurred during payment processing.");
          }
        }
      } catch (error) {
        console.error("Error processing payment callback:", error);
        toast.error("Failed to process payment result. Please contact support.");
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, [searchParams, clearCart, cartItems, arrivalTime, specialInstructions, orderType, branchId]);

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
          <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Transaction Details</h3>
            <div className="space-y-3">
              {paymentData?.transactionId && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Transaction ID:</span>
                  <span className="text-sm font-mono text-gray-800 bg-white px-2 py-1 rounded">{paymentData.transactionId}</span>
                </div>
              )}
              {paymentData?.referenceNumber && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Order ID:</span>
                  <span className="text-sm font-mono text-gray-800 bg-white px-2 py-1 rounded">{paymentData.referenceNumber}</span>
                </div>
              )}
              {paymentData?.amount && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="text-sm font-semibold text-gray-800">{paymentData.currency} ${paymentData.amount}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status:</span>
                <span
                  className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    isSuccess ? "bg-green-100 text-green-700" : isDeclined ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
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
                {/* <Button
                  onClick={() => navigate("/orders")}
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2"
                >
                  <span>View My Orders</span>
                  <ArrowRight className="w-5 h-5" />
                </Button> */}
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
