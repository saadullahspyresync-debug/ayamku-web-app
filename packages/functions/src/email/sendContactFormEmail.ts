import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from 'uuid';
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = Resource.ContactForm.name;

const ses = new SESClient({
  region: "us-east-1"
});
const SENDER_EMAIL = process.env.SENDER_EMAIL || "saadullah.spyresync@gmail.com";
const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL || "saadullah.spyresync@gmail.com"; // Your support email

interface ContactFormData {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
   status?: "new" | "pending" | "resolved";
}

async function storeContactInDB(data: ContactFormData) {
  const contactItem = {
    id: uuidv4(),          // unique ID for this submission
    userId: data.userId,   // reference to the user
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone || null,
    subject: data.subject,
    message: data.message,
    status: data.status || "new",
    submittedAt: new Date().toISOString(),
  };

  await dynamoDb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: contactItem,
    })
  );

  return contactItem;
}


function generateContactEmailHTML(data: ContactFormData): string {
  const submittedAt = new Date().toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">New Contact Request 📬</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">From your website contact form</p>
            </td>
          </tr>

          <!-- Contact Info -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #333;">Contact Information</h2>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 8px 0;">
                    <strong>Name:</strong>
                  </td>
                  <td style="text-align: right; padding: 8px 0;">
                    ${data.firstName} ${data.lastName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <strong>Email:</strong>
                  </td>
                  <td style="text-align: right; padding: 8px 0;">
                    <a href="mailto:${data.email}" style="color: #ef4444; text-decoration: none;">${data.email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <strong>Phone:</strong>
                  </td>
                  <td style="text-align: right; padding: 8px 0;">
                    <a href="tel:${data.phone}" style="color: #ef4444; text-decoration: none;">${data.phone}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <strong>Subject:</strong>
                  </td>
                  <td style="text-align: right; padding: 8px 0;">
                    <span style="background-color: #ef4444; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; text-transform: uppercase;">
                      ${data.subject}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <strong>Submitted:</strong>
                  </td>
                  <td style="text-align: right; padding: 8px 0;">
                    ${submittedAt}
                  </td>
                </tr>
              </table>

              <!-- Message -->
              <h2 style="margin: 30px 0 15px 0; font-size: 20px; color: #333;">Message</h2>
              <div style="background-color: #fef3c7; border-radius: 6px; padding: 20px; border-left: 4px solid #fbbf24;">
                <p style="margin: 0; color: #78350f; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
              </div>

              <!-- Quick Actions -->
              <div style="margin-top: 30px; text-align: center;">
                <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}" 
                   style="display: inline-block; background-color: #ef4444; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 0 10px;">
                  Reply via Email
                </a>
                <a href="tel:${data.phone}" 
                   style="display: inline-block; background-color: #10b981; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 0 10px;">
                  Call ${data.firstName}
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                This is an automated notification from your website contact form.
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

function generatePlainTextContact(data: ContactFormData): string {
  const submittedAt = new Date().toLocaleString();

  return `
NEW CONTACT REQUEST
===================

CONTACT INFORMATION
-------------------
Name: ${data.firstName} ${data.lastName}
Email: ${data.email}
Phone: ${data.phone}
Subject: ${data.subject}
Submitted: ${submittedAt}

MESSAGE
-------
${data.message}

---
This is an automated notification from your website contact form.
  `;
}

// Function to send confirmation email to the user
function generateUserConfirmationHTML(data: ContactFormData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Contacting Us</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Thank You! 🙏</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">We've received your message</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 10px 0; font-size: 16px;">Hi <strong>${data.firstName}</strong>,</p>
              <p style="margin: 0 0 20px 0; color: #666; line-height: 1.6;">
                Thank you for reaching out to us! We've received your message and our team will get back to you as soon as possible.
              </p>

              <h2 style="margin: 30px 0 15px 0; font-size: 20px; color: #333;">Your Message Summary</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 8px 0;">
                    <strong>Subject:</strong>
                  </td>
                  <td style="text-align: right; padding: 8px 0;">
                    ${data.subject}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <strong>Email:</strong>
                  </td>
                  <td style="text-align: right; padding: 8px 0;">
                    ${data.email}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <strong>Phone:</strong>
                  </td>
                  <td style="text-align: right; padding: 8px 0;">
                    ${data.phone}
                  </td>
                </tr>
              </table>

              <div style="background-color: #fef3c7; border-radius: 6px; padding: 20px; border-left: 4px solid #fbbf24; margin-bottom: 20px;">
                <p style="margin: 0; color: #78350f; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
              </div>

              <p style="margin: 20px 0 0 0; color: #666; line-height: 1.6;">
                We typically respond within 24-48 hours. If your inquiry is urgent, please feel free to call us directly.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                Need immediate assistance? Contact us at <a href="mailto:${RECIPIENT_EMAIL}" style="color: #ef4444; text-decoration: none;">${RECIPIENT_EMAIL}</a>
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

export const main = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }

    const data: ContactFormData = JSON.parse(event.body);

    data.status = data.status || "new";

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.message) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({ message: "Missing required fields" }),
      };
    }

    // Store in DynamoDB
    const savedContact = await storeContactInDB(data);
    console.log("💾 Contact stored in DynamoDB:", savedContact.id);

    // Send notification email to admin/support
    const adminEmailCommand = new SendEmailCommand({
      Source: SENDER_EMAIL,
      Destination: {
        ToAddresses: [RECIPIENT_EMAIL],
      },
      Message: {
        Subject: {
          Data: `New Contact: ${data.subject} - ${data.firstName} ${data.lastName}`,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: generateContactEmailHTML(data),
            Charset: "UTF-8",
          },
          Text: {
            Data: generatePlainTextContact(data),
            Charset: "UTF-8",
          },
        },
      },
      ReplyToAddresses: [data.email], // Allow direct reply to customer
    });

    // Send confirmation email to user
    const userEmailCommand = new SendEmailCommand({
      Source: SENDER_EMAIL,
      Destination: {
        ToAddresses: [data.email],
      },
      Message: {
        Subject: {
          Data: `Thank you for contacting us - ${data.subject}`,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: generateUserConfirmationHTML(data),
            Charset: "UTF-8",
          },
          Text: {
            Data: `Hi ${data.firstName},\n\nThank you for reaching out! We've received your message about "${data.subject}" and will get back to you soon.\n\nBest regards,\nYour Company`,
            Charset: "UTF-8",
          },
        },
      },
    });

    // Send both emails
    // await Promise.all([
    //   ses.send(adminEmailCommand),
    //   ses.send(userEmailCommand),
    // ]);

    // console.log("✅ Contact form emails sent successfully");

    await ses.send(adminEmailCommand);

    try {
      await ses.send(userEmailCommand);
    } catch (err) {
      console.warn("⚠️ User email failed, admin email sent", err);
    }


    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({
        message: "Contact form submitted successfully",
        success: true,
      }),
    };
  } catch (error) {
    console.error("❌ Error sending contact form email:", error);
    
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({
        message: "Failed to send contact form",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};