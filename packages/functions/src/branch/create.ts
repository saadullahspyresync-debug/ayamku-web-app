import * as uuid from "uuid";
import { Resource } from "sst";
import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const apiKey: string = Resource.GOOGLE_MAPS_API_KEY.value;


async function getTimezone(lat: number, lng: number): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${apiKey}`;
  
  const res = await fetch(url);
  const data = (await res.json()) as { status: string; timeZoneId: string };
  // console.log(data);
  
  if (data.status !== "OK") return "UTC"; // Fallback
  return data.timeZoneId; // Returns "Asia/Brunei" or "Asia/Karachi"
}

/**
 * HELPER: Fetch verified data from Google Places API
 */
export async function getVerifiedPlaceDetails(placeId: string): Promise<any> {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey || '',
      // Field Masking: This is mandatory in the NEW API. 
      // It specifies exactly what fields you want.
      'X-Goog-FieldMask': 'id,formattedAddress,addressComponents,location'
    }
  });
  
  const data = (await res.json()) ;

  if (res.status !== 200) {
    throw new Error(`Google API Validation Failed: ${data}`);
  }
  return data;
}

/**
 * HELPER: Parse address components into a flat object
 */
export function parseAddress(components: any[]) {
  const find = (type: string, useShort = false) => {
    // Note: In the NEW API, the field is 'longText' or 'shortText'
    const comp = components.find((c) => c.types.includes(type));
    return useShort ? comp?.shortText || "" : comp?.longText || "";
  };

  return {
    city: find("locality"),
    state: find("administrative_area_level_1"),
    postalCode: find("postal_code"),
    country: find("country"),
    countryCode: find("country", true),
  };
}

export async function main(event: APIGatewayProxyEvent) {
  
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Request body is missing" }),
    };
  }

  const data = JSON.parse(event.body);
  const { placeId, name } = data;

  // 1. Mandatory Fields Check
  if (!placeId || !name) {
    return { 
      statusCode: 400, 
      body: JSON.stringify({ error: "placeId and name are required" }) 
    };
  }

  // 2. BACKEND VALIDATION: Get Google's verified data
  const verifiedPlace = await getVerifiedPlaceDetails(placeId);
  const addressInfo = parseAddress(verifiedPlace.addressComponents);

  // 3. GEO-FENCING: Only allow specific countries (e.g., Malaysia)
  const allowedCountries = ["MY", "SG", "TH", "ID", "BN"];
  if (!allowedCountries.includes(addressInfo.countryCode)) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: `Country ${addressInfo.countryCode} is not supported.` })
    };
  }

  // 4. GEO-FENCING: Get timezone
  const timezone = await getTimezone(verifiedPlace.location.latitude, verifiedPlace.location.longitude);
  data.timezone = timezone;

  // Check if branch exists logic (using DynamoDB Query)
  // Assuming 'Branches' table with primary key 'branchId'
  // and a GSI on name+address+contactNumber for uniqueness check

  const branchId = uuid.v1();
  const params = {
    TableName: Resource.Branch.name,
    Item: {
      branchId,
      name,
      placeId: verifiedPlace.place_id,
      address: verifiedPlace.formatted_address,
      ...data,
      createdAt: Date.now(),
    },
  };

  try {
    await dynamoDb.send(new PutCommand(params));

    return {
      statusCode: 201,
      body: JSON.stringify({
        status: 201,
        message: "Branch created successfully",
        data: params.Item,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
    };
  }
}
