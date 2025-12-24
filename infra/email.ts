// infra/email.ts
import { Resource } from "sst";

export function EmailStack() {
  // Create SES Email Identity
  const senderEmail = new sst.aws.Email("SenderEmail", {
    sender: "testssssss.spyreync1@gmail.com",
    
    
  });

  // Create SNS Topic for async email sending (optional but recommended)
  const emailTopic = new sst.aws.SnsTopic("EmailTopic");

  // Email sending Lambda for order receipts
  const emailSender = new sst.aws.Function("EmailSender", {
    handler: "packages/functions/src/email/sendOrderReceipt.main",
    link: [senderEmail],
    timeout: "30 seconds",
    environment: {
      SENDER_EMAIL: senderEmail.sender,
    },
    permissions: [
      {
        actions: ["ses:SendEmail", "ses:SendRawEmail"],
        resources: ["*"],
      },
    ],
  });

  // NEW: Contact form email Lambda
  const contactFormEmailSender = new sst.aws.Function("ContactFormEmailSender", {
    handler: "packages/functions/src/email/sendContactFormEmail.main",
    link: [senderEmail],
    timeout: "30 seconds",
    environment: {
      SENDER_EMAIL: senderEmail.sender,
      RECIPIENT_EMAIL: "saadullah.spyresync@gmail.com", // Your support email
    },
    permissions: [
      {
        actions: ["ses:SendEmail", "ses:SendRawEmail"],
        resources: ["*"],
      },
    ],
  });

  // Subscribe Lambda to SNS topic for async processing
  emailTopic.subscribe("SubscriptionName", emailSender.arn);

  return {
    senderEmail,
    emailTopic,
    emailSender,
    contactFormEmailSender, // Export the new function
  };
}