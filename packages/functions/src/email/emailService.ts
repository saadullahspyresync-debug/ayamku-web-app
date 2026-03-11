import nodemailer from 'nodemailer';
import { Resource } from 'sst';


const transporter = nodemailer.createTransport({
  host: "smtp.zeptomail.com",
  port: 465,
  secure: true, // true for 465, false for 587
  auth: {
    user: "emailapikey",
    pass: Resource.EMAIL_PASS.value,
  },
});

export async function sendOrderConfirmation(to: string, orderData: any) {
  const orderDate = new Date(orderData.createdAt).toLocaleString();
  const scheduledDate = orderData.scheduledTime ? (() => {
    const [hours, minutes] = orderData.scheduledTime.split(':').map(Number);
    const date = new Date(); // Gets today's date
    date.setHours(hours, minutes, 0, 0); // Applies the "03:16" to today
    
    return date.toLocaleString("en-US", {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  })() : null;

  const mailOptions = {
    from: `"Ayamku Restaurant" <no-reply@ayamkubrunei.com>`,
    to: to,
    subject: `Order Confirmed: #${orderData.orderId}`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        /* Mobile-specific styles */
        @media screen and (max-width: 600px) {
          .container {
            width: 100% !important;
            border-radius: 0 !important;
          }
          .content-padding {
            padding: 20px !important;
          }
          .header-padding {
            padding: 30px 20px !important;
          }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8f8f8; color: #333333;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; padding: 20px 0;">
        <tr>
          <td align="center">
            <table class="container" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin: 0 auto;">
              
              <tr>
                <td class="header-padding" style="background-color: #e11d48; padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 26px; letter-spacing: 1px;">Order Confirmed! 🎉</h1>
                  <p style="margin: 10px 0 0 0; color: #ffe4e6; font-size: 16px;">We're getting your food ready.</p>
                </td>
              </tr>

              <tr>
                <td class="content-padding" style="padding: 30px;">
                  <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.5;">
                    Hi there, <br>
                    Thank you for choosing <strong>Ayamku</strong>. Your order has been successfully placed.
                  </p>

                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px dashed #e5e7eb; color: #6b7280; font-size: 13px; text-transform: uppercase;">Order ID:</td>
                      <td style="padding: 8px 0; border-bottom: 1px dashed #e5e7eb; text-align: right; font-weight: bold; color: #e11d48;">
                        #${orderData.orderId.toUpperCase()}
                      </td>
                    </tr>

                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px dashed #e5e7eb; color: #6b7280; font-size: 13px; text-transform: uppercase;">Order Date:</td>
                      <td style="padding: 8px 0; border-bottom: 1px dashed #e5e7eb; text-align: right; font-weight: bold;">
                        ${orderDate}
                      </td>
                    </tr>

                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Order Type:</td>
                      <td style="padding: 8px 0; text-align: right; font-weight: bold;">
                        ${orderData.orderType}
                      </td>
                    </tr>

                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Payment:</td>
                      <td style="padding: 8px 0; text-align: right; font-weight: bold;">
                        ${orderData.paymentMethod}
                      </td>
                    </tr>

                    ${scheduledDate ? `
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Scheduled Time:</td>
                      <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #1f2937;">
                        ${scheduledDate}
                      </td>
                    </tr>
                    ` : ''}

                    <tr>
                      <td style="padding: 12px 0 4px 0;">
                        <strong>Status:</strong>
                      </td>
                      <td style="text-align: right; padding: 12px 0 4px 0;">
                        <span style="background-color: #6ecf6aff; color: #f7f3f0ff; padding: 4px 10px; border-radius: 8px; font-size: 11px; text-transform: uppercase; font-weight: bold; display: inline-block;">
                          ${orderData.status}
                        </span>
                      </td>
                    </tr>
                  </table>

                  <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 2px solid #f3f4f6; padding-top: 15px;">
                    <tr>
                      <td style="font-size: 18px; font-weight: bold;">Amount Paid:</td>
                      <td style="text-align: right; font-size: 22px; font-weight: 900; color: #e11d48;">
                        $${orderData.totalPrice}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td class="content-padding" style="background-color: #1f2937; padding: 30px; text-align: center;">
                  <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 14px;">
                    Need help? <a href="mailto:support@ayamkubrunei.com" style="color: #fbbf24; text-decoration: none;">Contact Support</a>
                  </p>
                  <p style="margin: 0; color: #6b7280; font-size: 12px;">
                    © ${new Date().getFullYear()} Ayamku Restaurant.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `,
  };

  return transporter.sendMail(mailOptions);
}

export async function sendContactFormEmail(email: any, subject: any, name: any) {
  const mailOptions = {
    from: `"no-reply@ayamkubrunei.com" <no-reply@ayamkubrunei.com>`,
    to: email,
    subject: `New ${subject} Form Submission.`,
    html: `
      <p> We've received your message!</p>
      <p> We'll be in touch soon!</p>
      <p> Thanks for reaching out, ${name}</p>
    `,
  };

  return transporter.sendMail(mailOptions);
}

// Admin Reply Email
export async function sendAdminReply(event: any) {
  try {
    const parsedBody = JSON.parse(event.body);
    const { email, subject, replyText } = parsedBody;

    const mailOptions = {
      from: `"Ayamku Support" <support@ayamkubrunei.com>`, // Use your verified support address
      to: email,
      subject: `Re: ${subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; color: #333;">
          <div style="padding: 20px; border-left: 4px solid #e11d48; background-color: #fff1f2;">
            <p style="white-space: pre-wrap; font-size: 16px;">${replyText}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">
            Best regards,<br>
            <strong>Ayamku Restaurant Management</strong>
          </p>
        </div>
      `,
    };

    // 2. Actually trigger the mail
    await transporter.sendMail(mailOptions); 

    // 3. MANDATORY: You must return this specific structure to stop the 500 error
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Success" }),
    };

  } catch (error: any) {
    console.error("Handler Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}