import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocument.from(new DynamoDBClient({}));
const Table_Name = Resource.Footer.name;

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, ...data }),
});

export async function main (event: APIGatewayProxyEvent) {
    const data = JSON.parse(event.body || "{}");
    const { quickLinks, contactInfo } = data;

    if (!quickLinks || !contactInfo) {
        return sendResponse(400, "Invalid request");
    }

    const item = {
        id: "settings", // Fixed ID to ensure we only ever have one footer config
        quickLinks: {
            exploreMenu: quickLinks.exploreMenu,
            restaurantLocator: quickLinks.restaurantLocator,
            contactUs: quickLinks.contactUs,
            aboutUs: quickLinks.aboutUs
        },
        contactInfo: {
            address1: contactInfo.address1,
            address2: contactInfo.address2,
            phone: contactInfo.phone,
            email: contactInfo.email
        },
        updatedAt: Date.now(),
    };

    try {
        await dynamoDb.put({
            TableName: Table_Name,
            Item: item
        });
        return sendResponse(200, "Footer updated successfully");
    } catch (error) {
        return sendResponse(500, "Error updating footer");
    }
}