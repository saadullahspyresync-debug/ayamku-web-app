import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { v4 as uuidv4 } from "uuid"; // Recommended for unique IDs

import { sendContactFormEmail } from "./emailService";

const client = new DynamoDBClient({});
const dynamoDb = DynamoDBDocumentClient.from(client);

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message, ...data }),
});

export const main = async (event: APIGatewayProxyEvent) => {
  try {
    if (!event.body) return sendResponse(400, "Request body missing");
    
    const body = JSON.parse(event.body);
    const { firstName, lastName, email, message, branchId } = body;

    // Basic Validation
    if (!email || !message) {
      return sendResponse(400, "Email and message are required");
    }

    // Define the item to be stored
    const item = {
      id: uuidv4(), // Unique ID for the primary key
      branchId: branchId,
      firstName: firstName,
      lastName: lastName,
      email: email,
      message: message,
      phone: body.phone,
      status: body.status,
      subject: body.subject,
      submittedAt: new Date().toISOString(),
    };

    // Correct PutCommand syntax
    await dynamoDb.send(new PutCommand({
      TableName: Resource.ContactForm.name,
      Item: item,
    }));

    const name = `${item.firstName} ${item.lastName}`;

    // Send email notification to user
    await sendContactFormEmail(item.email, item.subject, name);

    return sendResponse(201, "Form successfully submitted", { id: item.id });
  } catch (err) {
    return sendResponse(500, "Error creating form submission", { 
      error: err instanceof Error ? err.message : String(err) 
    });
  }
};