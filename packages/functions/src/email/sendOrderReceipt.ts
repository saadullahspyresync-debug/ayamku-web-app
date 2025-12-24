// packages/functions/src/email/sendOrderReceipt.ts
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { SNSEvent } from "aws-lambda";

const ses = new SESClient({});
const SENDER_EMAIL = process.env.SENDER_EMAIL || "noreply@yourdomain.com";

interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  isRedeemed?: boolean;
}

interface OrderData {
  orderId: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: OrderItem[];
  address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    phone?: string;
  };
  paymentMethod: string;
  orderType: string;
  specialInstructions?: string;
  scheduledTime?: number;
  branchId?: string;
  branchName?: string;
  subtotal: number;
  redemptionDiscount: number;
  freeItemsCount: number;
  totalPrice: number;
  status: string;
  createdAt: number;
}

function generateOrderReceiptHTML(order: OrderData): string {
  const orderDate = new Date(order.createdAt).toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const scheduledDate = order.scheduledTime
    ? new Date(order.scheduledTime).toLocaleString("en-US", {
        dateStyle: "full",
        timeStyle: "short",
      })
    : null;

  const itemsHTML = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${item.name}</strong>
        ${
          item.isRedeemed
            ? '<span style="color: #10b981; font-size: 12px;"> (Redeemed)</span>'
            : ""
        }
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
        ${item.price === 0 ? "FREE" : `$${item.price.toFixed(2)}`}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
        ${
          item.price === 0
            ? "FREE"
            : `$${(item.price * item.quantity).toFixed(2)}`
        }
      </td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Receipt</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Order Confirmed! 🎉</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">Thank you for your order</p>
            </td>
          </tr>

          <!-- Order Info -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 10px 0; font-size: 16px;">Hi <strong>${
                order.userName
              }</strong>,</p>
              <p style="margin: 0 0 20px 0; color: #666; line-height: 1.6;">
                Your order has been successfully placed and is being processed. Here are the details:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 8px 0;">
                    <strong>Order ID:</strong>
                  </td>
                  <td style="text-align: right; padding: 8px 0;">
                    <span style="color: #667eea; font-weight: bold;">#${order.orderId
                      .substring(0, 8)
                      .toUpperCase()}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <strong>Order Date:</strong>
                  </td>
                  <td style="text-align: right; padding: 8px 0;">
                    ${orderDate}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <strong>Order Type:</strong>
                  </td>
                  <td style="text-align: right; padding: 8px 0;">
                    <span style="background-color: #667eea; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; text-transform: uppercase;">
                      ${order.orderType}
                    </span>
                  </td>
                </tr>
                ${
                  scheduledDate
                    ? `
                <tr>
                  <td style="padding: 8px 0;">
                    <strong>Scheduled Time:</strong>
                  </td>
                  <td style="text-align: right; padding: 8px 0;">
                    ${scheduledDate}
                  </td>
                </tr>
                `
                    : ""
                }
                <tr>
                  <td style="padding: 8px 0;">
                    <strong>Payment Method:</strong>
                  </td>
                  <td style="text-align: right; padding: 8px 0; text-transform: capitalize;">
                    ${order.paymentMethod}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <strong>Status:</strong>
                  </td>
                  <td style="text-align: right; padding: 8px 0;">
                    <span style="background-color: #fbbf24; color: #78350f; padding: 4px 12px; border-radius: 12px; font-size: 12px; text-transform: uppercase; font-weight: bold;">
                      ${order.status}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Order Items -->
              <h2 style="margin: 30px 0 15px 0; font-size: 20px; color: #333;">Order Items</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Item</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Qty</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Price</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
              </table>

              <!-- Price Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                <tr>
                  <td style="padding: 8px 0; text-align: right; color: #666;">Subtotal:</td>
                  <td style="padding: 8px 0; text-align: right; width: 100px; font-weight: 600;">
                    $${order.subtotal.toFixed(2)}
                  </td>
                </tr>
                ${
                  order.redemptionDiscount > 0
                    ? `
                <tr>
                  <td style="padding: 8px 0; text-align: right; color: #10b981;">
                    Redemption Discount (${order.freeItemsCount} item${
                        order.freeItemsCount > 1 ? "s" : ""
                      }):
                  </td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #10b981;">
                    -$${order.redemptionDiscount.toFixed(2)}
                  </td>
                </tr>
                `
                    : ""
                }
                <tr style="border-top: 2px solid #e5e7eb;">
                  <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold;">Total:</td>
                  <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold; color: #667eea;">
                    $${order.totalPrice.toFixed(2)}
                  </td>
                </tr>
              </table>

              ${
                order.address && (order.address.street || order.address.phone)
                  ? `
              <!-- Delivery Address -->
              <h2 style="margin: 30px 0 15px 0; font-size: 20px; color: #333;">Delivery Details</h2>
              <div style="background-color: #f9fafb; border-radius: 6px; padding: 15px; border-left: 4px solid #667eea;">
                ${
                  order.address.street
                    ? `<p style="margin: 0 0 5px 0;"><strong>Address:</strong> ${order.address.street}</p>`
                    : ""
                }
                ${
                  order.address.city
                    ? `<p style="margin: 0 0 5px 0;">${order.address.city}${
                        order.address.state ? `, ${order.address.state}` : ""
                      }${
                        order.address.zipCode ? ` ${order.address.zipCode}` : ""
                      }</p>`
                    : ""
                }
                ${
                  order.address.phone
                    ? `<p style="margin: 0;"><strong>Phone:</strong> ${order.address.phone}</p>`
                    : ""
                }
              </div>
              `
                  : ""
              }

              ${
                order.specialInstructions
                  ? `
              <!-- Special Instructions -->
              <h2 style="margin: 30px 0 15px 0; font-size: 20px; color: #333;">Special Instructions</h2>
              <div style="background-color: #fef3c7; border-radius: 6px; padding: 15px; border-left: 4px solid #fbbf24;">
                <p style="margin: 0; color: #78350f;">${order.specialInstructions}</p>
              </div>
              `
                  : ""
              }

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                Need help? Contact us at <a href="mailto:support@yourdomain.com" style="color: #667eea; text-decoration: none;">support@yourdomain.com</a>
              </p>
              <p style="margin: 0; color: #999; font-size: 12px;">
                © ${new Date().getFullYear()} Your Company. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generatePlainTextReceipt(order: OrderData): string {
  const orderDate = new Date(order.createdAt).toLocaleString();
  const scheduledDate = order.scheduledTime
    ? new Date(order.scheduledTime).toLocaleString()
    : null;

  let text = `
ORDER CONFIRMED!
================

Hi ${order.userName},

Your order has been successfully placed and is being processed.

ORDER DETAILS
-------------
Order ID: #${order.orderId.substring(0, 8).toUpperCase()}
Order Date: ${orderDate}
Order Type: ${order.orderType.toUpperCase()}
${scheduledDate ? `Scheduled Time: ${scheduledDate}\n` : ""}Payment Method: ${
    order.paymentMethod
  }
Status: ${order.status.toUpperCase()}

ORDER ITEMS
-----------
`;

  order.items.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    text += `${item.name}${item.isRedeemed ? " (Redeemed)" : ""}\n`;
    text += `  Qty: ${item.quantity} × $${item.price.toFixed(
      2
    )} = $${itemTotal.toFixed(2)}\n`;
  });

  text += `
PRICE SUMMARY
-------------
Subtotal: $${order.subtotal.toFixed(2)}
`;

  if (order.redemptionDiscount > 0) {
    text += `Redemption Discount (${order.freeItemsCount} item${
      order.freeItemsCount > 1 ? "s" : ""
    }): -$${order.redemptionDiscount.toFixed(2)}\n`;
  }

  text += `
Total: $${order.totalPrice.toFixed(2)}
`;

  if (order.address && (order.address.street || order.address.phone)) {
    text += `
DELIVERY DETAILS
----------------
`;
    if (order.address.street) text += `Address: ${order.address.street}\n`;
    if (order.address.city)
      text += `${order.address.city}${
        order.address.state ? `, ${order.address.state}` : ""
      }${order.address.zipCode ? ` ${order.address.zipCode}` : ""}\n`;
    if (order.address.phone) text += `Phone: ${order.address.phone}\n`;
  }

  if (order.specialInstructions) {
    text += `
SPECIAL INSTRUCTIONS
--------------------
${order.specialInstructions}
`;
  }

  text += `
Need help? Contact us at support@yourdomain.com

© ${new Date().getFullYear()} Your Company. All rights reserved.
`;

  return text;
}

export const main = async (event: SNSEvent | OrderData) => {
  try {
    // Handle both SNS events and direct invocations
    let orderData: OrderData;

    if ("Records" in event) {
      // SNS Event (async)
      const message = JSON.parse(event.Records[0].Sns.Message);
      orderData = message;
    } else {
      // Direct invocation (sync)
      orderData = event as OrderData;
    }

    console.log("📧 Sending order receipt to:", orderData.userEmail);

    const htmlBody = generateOrderReceiptHTML(orderData);
    const textBody = generatePlainTextReceipt(orderData);

    const command = new SendEmailCommand({
      Source: SENDER_EMAIL,
      Destination: {
        ToAddresses: [orderData.userEmail],
      },
      Message: {
        Subject: {
          Data: `Order Confirmation #${orderData.orderId
            .substring(0, 8)
            .toUpperCase()} - Thank You!`,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: "UTF-8",
          },
          Text: {
            Data: textBody,
            Charset: "UTF-8",
          },
        },
      },
    });

    await ses.send(command);

    console.log("✅ Email sent successfully to:", orderData.userEmail);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Email sent successfully",
        orderId: orderData.orderId,
      }),
    };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};
