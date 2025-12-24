// packages/functions/src/secure-acceptance.ts
import { APIGatewayProxyEvent } from "aws-lambda";
import * as crypto from "crypto";

// Your Secure Acceptance Profile Credentials
const PROFILE_ID = "620EDAB2-F985-4F1D-892F-7A4081C8C94F";
const ACCESS_KEY = "700da333945031e8b8eb3620d3eb4b41";
const SECRET_KEY = "d796a2630ee646f7af2e19ee6449042f69a2a784be3a4625987fdb9965fb2be060cf2c9a8fd840428f51a5fc7a97558ab317cb446b6b489eaf2e8d72e470f498dd95f85b2be440a19709d8e4e6bff8d93fba81bbbfd2471d9764e44058b3f1f428e05a7588cf41449c8059f83be6d9ff1eb12a0533fe42fca381bfb9227884e9";
const PAYMENT_URL = "https://testsecureacceptance.cybersource.com/pay";

// ✅ FIXED: Update this to your actual API Gateway domain after deployment
const PAYMENT_RECEIPT_URL = "https://e4girjfm00.execute-api.us-east-1.amazonaws.com/payment-receipt";
// const FRONTEND_URL = "https://e4girjfm00.execute-api.us-east-1.amazonaws.com/payment-receipt";

const FRONTEND_URL = "https://d2871ozn3su384.cloudfront.net";  // development

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

    const data = JSON.parse(event.body);
    const { amount, currency = "BND", orderId, customerEmail, customerName } = data;

    if (!amount || !orderId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Missing required fields: amount and orderId are required.",
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
        "access_key,profile_id,transaction_uuid,signed_field_names,unsigned_field_names,signed_date_time,locale,transaction_type,reference_number,amount,currency,override_custom_receipt_page",

      unsigned_field_names: "",
      signed_date_time: transactionTime,
      locale: "en",
      transaction_type: "sale",
      reference_number: orderId,
      amount: amount,
      currency: currency,

      override_custom_receipt_page: PAYMENT_RECEIPT_URL,
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

    // const params: PaymentParams = {};

    // const pairs = body.split("&");
    // for (const pair of pairs) {
    //   const [key, value] = pair.split("=");
    //   if (key) {
    //     params[decodeURIComponent(key)] = decodeURIComponent(value || "");
    //   }
    // }

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
          console.log("Expected:", calculatedSignature);
          console.log("Received:", receivedSignature);
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

    // ✅ Payment SUCCESSFUL
    if (decision === "ACCEPT") {
      // Redirect to success page
      const redirectUrl = `${FRONTEND_URL}/#/payment-success?orderId=${orderId}&transactionId=${transactionId}&amount=${authAmount}&currency=${currency}&decision=${decision}`;

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
      // Redirect to failure page
      // const failureUrl = `${FRONTEND_URL}/#/payment-failure?orderId=${orderId}&reason=${encodeURIComponent(
      //   message
      // )}&code=${reasonCode}`;

      const failureUrl = `${FRONTEND_URL}/#/payment-failure?orderId=${orderId}&reason=${encodeURIComponent(message)}&code=${reasonCode}`;


      return {
        statusCode: 200,
        headers: {
          Location: failureUrl,
          "Access-Control-Allow-Origin": "*",
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