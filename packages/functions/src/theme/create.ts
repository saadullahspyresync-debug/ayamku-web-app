
import * as uuid from "uuid";
import { Resource } from "sst";
import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = Resource.ThemeTemplate.name;

export async function main(event: APIGatewayProxyEvent) {
    const { themeName, primaryColor, bannerImg } = JSON.parse(event?.body!);

    const params = {
        TableName: TABLE_NAME,
        Item: {
            templateId: uuid.v1(),
            themeName: themeName,
            primaryColor: primaryColor,
            bannerImg: bannerImg,
            createdAt: new Date().toISOString()
        }
    };

    try {
        await dynamoDb.send(new PutCommand(params));
        return {
            statusCode: 201,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: "Template saved to library!" })
        };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify(err) };
    }
};
