import { Resource } from "sst";
import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = Resource.AppSettings.name;

export async function main(event: APIGatewayProxyEvent) {
    const params = {
        TableName: TABLE_NAME,
        Key: {
            id: "ACTIVE_THEME" // This is the fixed ID we use for the live config
        }
    };

    try {
        const result = await dynamoDb.send(new GetCommand(params));

        if (!result.Item) {
            // Fallback: If no theme is set, return Ayamku's default branding
            return {
                statusCode: 200,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({
                    data: {
                        themeName: "Default",
                        primaryColor: "#e53e3e", // Standard Ayamku Red
                        bannerImg: "https://monorepo-temp-devs-venture-dev-machine-ayamkuwebbucket-kwzoukcv.s3.amazonaws.com/196f2e96b3111dc11ed33c8f75da2d89.jpg"
                    }
                })
            };
        }

        return {
            statusCode: 200,
            headers: { 
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "Active theme retrieved",
                data: result.Item
            })
        };
    } catch (err: any) {
        console.error("DynamoDB Get Error:", err);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: err.message }) 
        };
    }
}
