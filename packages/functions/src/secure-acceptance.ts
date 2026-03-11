// packages/functions/src/secure-acceptance.ts
import { APIGatewayProxyEvent } from "aws-lambda";
import * as crypto from "crypto";
import { Resource } from "sst";

import { getProductFromDB, savePendingOrder, getPendingOrder } from "./lib/db";
import { finalizeAndProcessOrder } from "./order/create";

// Your Secure Acceptance Profile Credentials

const PROFILE_ID: string = Resource.CYBERSOURCE_MERCHANT_ID.value;
const ACCESS_KEY: string = Resource.CYBERSOURCE_ACCESS_KEY.value;
const SECRET_KEY: string = Resource.CYBERSOURCE_SECRET_KEY.value;

const PAYMENT_URL: string = process.env.CYBERSOURCE_PAYMENT_URL!;
const FRONTEND_URL: string = process.env.APP_FRONTEND_URL!;


// ✅ FIXED: Update this to your actual API Gateway domain after deployment
const BASE_API_URL: string = process.env.API_BASE_URL!;
const PAYMENT_RECEIPT_URL = `${BASE_API_URL}/payment-receipt`; //Receipt URL must be whitelisted in CyberSource


interface PaymentParams {
  [key: string]: string;
}

function signData(params: PaymentParams, secretKey: string): string {
  const signedFieldNames = params.signed_field_names.split(",");
  const dataToSign = signedFieldNames
    .map((field) => `${field}=${params[field]}`)
    .join(",");

  return crypto
    .createHmac("sha256", secretKey)
    .update(dataToSign)
    .digest("base64");
}

// 1. Helper function to calculate total safely
async function calculateSafeTotal(cartItems: any[]) {
  let total = 0;
  for (const item of cartItems) {    
    // 🛡️ SECURITY: Fetch the price from YOUR DB, not from the request body
    const product = await getProductFromDB(item.itemId); 
    if (product) {
      total += product.price * item.quantity;
    }
  }
  return total;
}

export async function main(event: APIGatewayProxyEvent) {
  console.log("🚀 SECURE ACCEPTANCE INVOKED");

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, ngrok-skip-browser-warning",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true", // 🔥 FIX 3: Add this
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing request body" }),
      };
    }

    // 1. Parse the request body
    const data = JSON.parse(event.body);
    const { cartItems, orderMetadata } = data; // Received from PaymentForm.tsx

    // 2. Recalculate the amount server-side
    const validatedAmount = await calculateSafeTotal(cartItems);
    const amountStr = validatedAmount.toFixed(2);

    // 3. Generate Order ID
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // 🛡️ RECORD EXPECTATION
    try {
      await savePendingOrder({
        orderId,
        status: "pending",
        items: cartItems,
        metadata: {
          userId: orderMetadata.userId,
          email: orderMetadata.email,
          orderType: orderMetadata.orderType,
          branchId: orderMetadata.branchId,
          scheduledTime: orderMetadata.scheduledTime,
          specialInstructions: orderMetadata.specialInstructions,
          currency: orderMetadata.currency,
          paymentMethod: orderMetadata.paymentMethod,

          redemptionIds: orderMetadata.redemptionIds || [],
          redemptionDiscount: orderMetadata.redemptionDiscount || 0,
          subtotal: amountStr,
          totalPrice: amountStr,
        }
      });
    } catch (dbError) {
      throw new Error("Internal server error: Could not record order.");
    }

    if (!amountStr) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Missing required fields: amount is required.",
        }),
      };
    }

    const transactionUuid = crypto.randomUUID();
    const transactionTime = new Date().toISOString().slice(0, 19) + "Z";

    const params: PaymentParams = {
      access_key: ACCESS_KEY,
      profile_id: PROFILE_ID,
      transaction_uuid: transactionUuid,

      // Must include ALL fields you're sending
      signed_field_names:
        "access_key,profile_id,transaction_uuid,signed_field_names,unsigned_field_names,signed_date_time,locale,transaction_type,reference_number,amount,currency,override_custom_receipt_page,override_custom_cancel_page",

      unsigned_field_names: "",
      signed_date_time: transactionTime,
      locale: "en",
      transaction_type: "sale",
      reference_number: orderId,
      amount: amountStr,
      currency: orderMetadata.currency || "BND",

      override_custom_receipt_page: PAYMENT_RECEIPT_URL,
      override_custom_cancel_page: PAYMENT_RECEIPT_URL,
      // override_custom_receipt_page: `${FRONTEND_URL}#/payment-success`,
      // merchant_defined_data1: customerEmail || "",
      // merchant_defined_data1: PAYMENT_RECEIPT_URL || "",
    };

    const signature = signData(params, SECRET_KEY);
    params.signature = signature;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        paymentUrl: PAYMENT_URL,
        params: params,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Failed to generate payment form",
        details: error.message,
      }),
    };
  }
}

// ✅ NEW: Payment receipt handler that redirects to frontend
export async function handlePaymentReceipt(event: APIGatewayProxyEvent) {
  console.log("🚀 PAYMENT RECEIPT HANDLER INVOKED");

  try {
    // Payment Error Page
    if (!event.body) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "text/html",
        },
        body: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta http-equiv="refresh" content="2;url=${FRONTEND_URL}/payment-failure?error=no_data">
            <title>Payment Error</title>
          </head>
          <body style="font-family: sans-serif; text-align: center; padding-top: 100px;">
            <h1>⚠️ No payment data received</h1>
            <p>Redirecting...</p>
          </body>
          </html>
          `,
      };
    }

    let rawBody = event.body;
    if (event.isBase64Encoded) {
      rawBody = Buffer.from(event.body, "base64").toString("utf8");
    }
    function parseFormEncoded(body: string): Record<string, string> {
      const params = new URLSearchParams(body);
      const result: Record<string, string> = {};

      for (const [key, value] of params.entries()) {
        result[key] = value;
      }

      return result;
    }
    const params = parseFormEncoded(rawBody);

    const decision = params.decision || "ERROR";
    const transactionId = params.transaction_id || "unknown";
    const orderId = params.req_reference_number || "unknown";
    const authAmount = params.auth_amount || "0";
    const reasonCode = params.reason_code || "";
    const message = params.message || "Unknown error";
    const currency = params.req_currency || "BND";
    const authTime = params.auth_time || new Date().toISOString();

    // ✅ Verify signature
    const receivedSignature = params.signature;
    let signatureValid = false;

    if (receivedSignature && params.signed_field_names) {
      try {
        const paramsToValidate = { ...params };
        delete paramsToValidate.signature;
        const calculatedSignature = signData(paramsToValidate, SECRET_KEY);

        if (receivedSignature === calculatedSignature) {
          console.log("✅ Signature verified");
          signatureValid = true;
        } else {
          console.error("⚠️ SIGNATURE MISMATCH - Possible tampering!");
        }
      } catch (err) {
        console.error("Error verifying signature:", err);
      }
    }

    // ❌ Reject if signature is invalid || Security Error Page
    if (!signatureValid && receivedSignature) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "text/html" },
        body: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta http-equiv="refresh" content="2;url=${FRONTEND_URL}/payment-failure?error=invalid_signature">
            <title>Security Error</title>
          </head>
          <body style="font-family: sans-serif; text-align: center; padding-top: 100px;">
            <h1>🔒 Security Verification Failed</h1>
            <p>Payment cannot be verified. Please contact support.</p>
            <p>Redirecting...</p>
          </body>
          </html>
          `,
      };
    }

    // 3. Handle CANCELLATION (User clicked cancel on CyberSource)
    if (decision === "CANCEL" || reasonCode === "400") {
      return {
        statusCode: 302,
        headers: {
          Location: `${FRONTEND_URL}/#/payment-failure?orderId=${orderId}&reason=${message}`,
          "Cache-Control": "no-cache"
        },
        body: ""
      };
    }

    // ✅ Payment SUCCESSFUL
    if (decision === "ACCEPT" && reasonCode === "100" && signatureValid) {
      
      // 1. Fetch the PENDING order you saved in Step 1 (the checkout step)
      const pendingOrder = await getPendingOrder(orderId);
      if (!pendingOrder) {
        return { statusCode: 404, body: "Order not found" };
      }

      // 2. SECURITY: Compare amounts (authAmount from CyberSource vs amount in DB)
      if (parseFloat(authAmount) !== parseFloat(pendingOrder.totalPrice)) {
        return { statusCode: 400, body: "Amount mismatch" };
      }

      // 🚀 THE BIG PATCH: Call your business logic from create.ts
      try {
        await finalizeAndProcessOrder(orderId, transactionId);
      } catch (err) {
        console.error("Business logic failed, but payment was successful:", err);
      }

      // Redirect to success page
      const redirectUrl = `${FRONTEND_URL}/#/payment-success?orderId=${orderId}&decision=${decision}`;

      return {
        statusCode: 302,
        headers: {
          Location: redirectUrl,
          "Access-Control-Allow-Origin": "*",
        },
        body: "",
      };
    }

    // ❌ Payment FAILED or DECLINED
    else {
      const failureUrl = `${FRONTEND_URL}/#/payment-failure?orderId=${orderId}&reason=${encodeURIComponent(message)}&code=${reasonCode}`;

      return {
        statusCode: 302,
        headers: {
          Location: failureUrl,
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache"
        },
        body: ""

      };
    }
  } catch (error: any) {
    console.error("❌ Error in payment receipt handler:", error);

    //  failure page / payment error
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html",
      },
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="refresh" content="2;url=${FRONTEND_URL}/payment-failure?error=processing_error">
          <title>Payment Error</title>
        </head>
        <body style="font-family: sans-serif; text-align: center; padding-top: 100px;">
          <h1>⚠️ Error processing payment</h1>
          <p>Redirecting you back...</p>
        </body>
        </html>
        `,
    };
  }
}

// Keep old webhook handler for backwards compatibility
export async function handleWebhook(event: APIGatewayProxyEvent) {
  console.log("🚀 SECURE ACCEPTANCE WEBHOOK INVOKED");
  return handlePaymentReceipt(event);
}