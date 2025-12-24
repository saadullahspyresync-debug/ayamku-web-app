import {
  DynamoDBClient,
  BatchWriteItemCommand,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { logger } from "@shr/core/util";
import { Resource } from "sst";
import {
  SignUpCommand,
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { v4 as uuidv4 } from "uuid";
import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { eb } from "../util/eventBridge";
import {
  ListObjectsV2Command,
  S3Client,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { deleteAllItemsByPK, getItem, putItem, queryItems, scanItems, TABLE_NAME } from "../util/dynamodb";
import { Employee, UserRole } from "../interfaces";

const region = "us-east-1";
const s3Client = new S3Client({ region });

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const cognitoClient = new CognitoIdentityProviderClient();

const newUserSignup = ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to Infenet.net!</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
        }
        .header {
            text-align: center;
            padding-bottom: 20px;
        }
        .header img {
            width: 150px;
        }
        .content {
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 8px;
        }
        .content h2 {
            color: #333333;
        }
        .content p {
            color: #555555;
            line-height: 1.6;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            font-size: 12px;
            color: #888888;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- <div class="header">
            Infenet.net
        </div> -->
        <div class="content">
            <h2>Welcome!</h2>
            <p>Thank you for registering with Infenet.net!. We're excited to have you on board!</p>
            <p><strong>Your Account Details:</strong></p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p>Please log in using your password provided above. For security reasons, we recommend changing your password after your first login.</p>
            <p>If you have any questions or need assistance, feel free to contact our support team.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} infenet.net. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;
};

export const deleteUserFromCognito = async (username: string) => {
  const deleteUserCommand = new AdminDeleteUserCommand({
    UserPoolId: Resource.UserPool.id,
    Username: username,
  });

  try {
    await cognitoClient.send(deleteUserCommand);
    logger.info(`Cognito user deleted successfully during rollback: ${username}`); // Use logger
  } catch (error: any) { // Use 'any' or a more specific AWS error type
    if (error.name === 'UserNotFoundException') {
      logger.warn(`Cognito user ${username} not found during rollback (likely never created or already deleted).`);
    } else {
      logger.error(`Error deleting Cognito user ${username} during rollback:`, { error }); // Use logger
    }
  }
};

/**
 * Get employee extended profile data using single-table design
 * Fetches both core profile and extended profile data
 */
export const getEmployeeDetails = async (employeeId: string) => {
  if (!employeeId.startsWith("EMPLOYEE#")) {
    employeeId = `EMPLOYEE#${employeeId}`;
  }

  try {
    // First get the core profile data
    const profileData = await getItem(employeeId, "PROFILE");

    if (!profileData) {
      return null;
    }

    // Then get all extended profile data
    const extendedData = await queryItems({
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": employeeId,
        ":skPrefix": "PROFILE_EXTENDED"
      }
    });

    // Filter related data by prefix
    const familyBackground = extendedData.Items.filter(
      item => item.SK.startsWith("PROFILE_EXTENDED#FAMILY#")
    );

    const workExperience = extendedData.Items.filter(
      item => item.SK.startsWith("PROFILE_EXTENDED#WORK#")
    );

    const education = extendedData.Items.filter(
      item => item.SK.startsWith("PROFILE_EXTENDED#EDUCATION#")
    );

    const referees = extendedData.Items.filter(
      item => item.SK.startsWith("PROFILE_EXTENDED#REFEREE#")
    );

    // Format the response to match the expected structure
    return {
      familyBackground,
      workExperience,
      education,
      referees,
      personalInfo: profileData,
    };
  } catch (error) {
    logger.error("Error fetching employee data:", { error });
    throw new Error("Error fetching employee extended profile data");
  }
};


/**
 * Checks if a user exists in both DynamoDB and Cognito
 * @param {string} email - The email of the user to check
 * @returns {Promise<{existsInDynamoDb: boolean, existsInCognito: boolean, status: boolean}>} 
 *   - existsInDynamoDb: true if user exists in DynamoDB
 *   - existsInCognito: true if user exists in Cognito
 *   - status: true if user exists in both systems
 */
export const checkUserExistence = async (email: string) => {
  if (!email) {
    throw new Error("Email is required");
  }

  const result = {
    existsInDynamoDb: false,
    existsInCognito: false,
    status: false
  };

  try {
    // Check if user exists in DynamoDB
    const dynamoDbUser = await findUserInDynamoDb(email);
    result.existsInDynamoDb = !!dynamoDbUser;

    // Check if user exists in Cognito
    result.existsInCognito = await checkUserInCognito(email);

    // Set overall status - true only if exists in both systems
    result.status = result.existsInDynamoDb && result.existsInCognito;

    return result;
  } catch (error) {
    logger.error("Error checking user existence:", { error, email });
    throw new Error(`Error checking user existence: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Find a user in DynamoDB by email
 * @param {string} email - User's email
 * @returns {Promise<object|null>} User object if found, null otherwise
 */
async function findUserInDynamoDb(email: string) {
  try {
    const scanResult = await scanItems({
      FilterExpression: "email = :email AND entityType = :entityType AND SK = :profile",
      ExpressionAttributeValues: {
        ":email": email,
        ":entityType": "EMPLOYEE",
        ":profile": "PROFILE"
      },
      Limit: 1
    });

    return (scanResult.Items && scanResult.Items.length > 0) ? scanResult.Items[0] : null;

  } catch (error) {
    logger.error("Error finding user in DynamoDB:", { error, email });
    throw error;
  }
}

/**
 * Check if a user exists in Cognito
 * @param {string} email - User's email (Cognito username)
 * @returns {Promise<boolean>} True if user exists, false otherwise
 */
async function checkUserInCognito(email: string) {
  try {
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: Resource.UserPool.id,
      Username: email
    });

    // If successful, user exists
    await cognitoClient.send(getUserCommand);
    return true;
  } catch (error: unknown) {
    // UserNotFoundException means user doesn't exist
    if (error instanceof Error && error.name === 'UserNotFoundException') {
      return false;
    }

    // For other errors, log and re-throw
    logger.error("Error checking Cognito user:", { error, email });
    throw error;
  }
}

export const createCognitoUser = async ({
  email,
  password,
  role,
  branchId,
}: {
  email: string;
  password: string;
  role?: UserRole;
  branchId?: string;
}) => {
  const signUpCommand = new SignUpCommand({
    ClientId: Resource.UserPoolClient.id,
    Username: email,
    Password: password,
    UserAttributes: [
      {
        Name: "custom:role",
        Value: role as UserRole,
      },
      {
        Name: "custom:branchId",
        Value: branchId as string || "",
      },
    ],
  });

  let signUpResponse;
  try {
    signUpResponse = await cognitoClient.send(signUpCommand);
    logger.info("Cognito UserId:", { s: signUpResponse.UserSub });
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error creating Cognito user:", { error });
      throw new Error(`Error creating Cognito user: ${error.message}`);
    } else {
      logger.error("Unexpected error:", { error });
      throw new Error("Unexpected error occurred while creating Cognito user.");
    }
  }

  try {
    await eb.send(
      new PutEventsCommand({
        Entries: [
          {
            EventBusName: Resource.Bus.name,
            Source: "EMAIL_SERVICE",
            DetailType: "SEND_EMAIL",
            Detail: JSON.stringify({
              email: email,
              content: newUserSignup({ email, password }),
            }),
          },
        ],
      })
    );
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error sending email:", { error });
      throw new Error(`Error sending email: ${error.message}`);
    } else {
      logger.error("Unexpected error:", { error });
      throw new Error("Unexpected error occurred while sending email.");
    }
  }

  return signUpResponse;
};

/**
 * Delete employee and all related data from the single-table database
 */
export const deleteUserById = async ({ employeeId }: { employeeId: string }) => {
  try {
    // Normalize the employeeId format
    if (!employeeId.startsWith("EMPLOYEE#")) {
      employeeId = `EMPLOYEE#${employeeId}`;
    }

    // Fetch employee data to verify it exists and get email for Cognito deletion
    const employeeData = await getEmployeeDetails(employeeId);
    if (!employeeData) {
      throw new Error("Employee not found");
    }

    // 1. Delete all items with this PK using the utility function
    await deleteAllItemsByPK(employeeId);

    // 2. Delete S3 files
    try {
      // Get the non-prefixed employeeId for S3 paths
      const plainEmployeeId = employeeId.replace("EMPLOYEE#", "");

      const listParams = {
        Bucket: Resource.shr.name,
        Prefix: `${plainEmployeeId}/`
      };

      const listedObjects = await s3Client.send(new ListObjectsV2Command(listParams));
      const filtered = listedObjects.Contents?.filter(item =>
        item.Key?.startsWith(`${plainEmployeeId}/`)
      );

      if (filtered && filtered.length > 0) {
        const deleteParams = {
          Bucket: Resource.shr.name,
          Delete: {
            Objects: filtered.map(item => ({ Key: item.Key })),
            Quiet: true
          }
        };

        await s3Client.send(new DeleteObjectsCommand(deleteParams));
        logger.info("Employee files deleted successfully");
      }
    } catch (error) {
      logger.error("Error deleting S3 files:", { error });
      // Continue with user deletion even if S3 deletion fails
    }

    // 3. Delete user from Cognito
    try {
      await deleteUserFromCognito(employeeData.personalInfo.email);
    } catch (error) {
      logger.error("Error deleting user from Cognito:", { error });
      throw new Error("Error deleting user from Cognito");
    }

    // 3. Delete user shifts
    try {
      await eb.send(
        new PutEventsCommand({
          Entries: [
            {
              EventBusName: Resource.Bus.name,
              Source: "USER_SERVICE",
              DetailType: "DELETE_USER_SHIFTS",
              Detail: JSON.stringify({
                employeeId: employeeId,
              }),
            },
          ],
        })
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error("Error sending email:", { error });
        throw new Error(`Error sending email: ${error.message}`);
      } else {
        logger.error("Unexpected error:", { error });
        throw new Error("Unexpected error occurred while sending email.");
      }
    }

    return true;
  } catch (error) {
    logger.error("Error deleting employee:", { error });
    throw new Error(`Error deleting employee: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const deleteUserShifts = async (employeeId: string) => {
}

export async function batchPutEmployeeFamilyBackground(
  employeeFamilyBackground: any,
  employeeId: string
) {
  if (
    !employeeFamilyBackground ||
    employeeFamilyBackground.length === 0 ||
    employeeFamilyBackground.length > 20
  ) {
    console.log("No family background data to process or data too large");
    return; // Or throw an error if needed
  }

  const putRequests = employeeFamilyBackground.reduce(
    (acc: any, family: any) => {
      const hasData =
        family.name ||
        family.relationship ||
        family.gender ||
        family.icNumber ||
        family.dob ||
        family.family ||
        family.occupation ||
        family.nationality ||
        family.detailsNote;

      if (hasData) {
        const item = {
          familyId: uuidv4(),
          employeeId,
          name: family.name,
          relationship: family.relationship,
          gender: family.gender,
          icNumber: family.icNumber,
          dob: family.dob,
          nationality: family.nationality,
          occupation: family.occupation,
          detailsNote: family.detailsNote,
          createdAt: new Date().toISOString(),
        };

        acc.push({
          PutRequest: {
            Item: marshall(item),
          },
        });
      }
      return acc;
    },
    []
  );

  if (putRequests.length === 0) {
    console.log("No valid family data found to put.");
    return;
  }

  const batchWriteParams = {
    RequestItems: {
      [Resource.smarthrtableFamilyBackground.name]: putRequests,
    },
  };

  try {
    const data = await dynamoDb.send(
      new BatchWriteItemCommand(batchWriteParams)
    );
    console.log("Batch write successful for employee family:", data);

    // Handle unprocessed items (if any)
    if (
      data.UnprocessedItems &&
      Object.keys(data.UnprocessedItems).length > 0
    ) {
      console.log("Unprocessed items:", data.UnprocessedItems);
      // Implement retry logic for unprocessed items if needed
    }
    return data;
  } catch (error) {
    console.error("Error in batch write:", error);
    throw error;
  }
}

export async function batchPutEmployeeWorkExperience(
  employeeWorkExperience: any,
  employeeId: string
) {
  if (
    !employeeWorkExperience ||
    employeeWorkExperience.length === 0 ||
    employeeWorkExperience.length > 20
  ) {
    console.log("No work experience data to process or data too large");
    return; // Or throw an error if needed
  }

  const putRequests = employeeWorkExperience.reduce((acc: any, work: any) => {
    const hasData =
      work.company ||
      work.position ||
      work.startDate ||
      work.endDate ||
      work.location ||
      work.salary ||
      work.dutiesNOTE ||
      work.benefitsNote;

    if (hasData) {
      const item = {
        experienceId: uuidv4(),
        employeeId,
        company: work.company,
        position: work.position,
        startDate: work.startDate,
        endDate: work.endDate,
        location: work.location,
        salary: work.salary,
        dutiesNote: work.dutiesNOTE,
        benefitsNote: work.benefitsNote,
        createdAt: new Date().toISOString(),
      };

      acc.push({
        PutRequest: {
          Item: marshall(item),
        },
      });
    }
    return acc;
  }, []);

  if (putRequests.length === 0) {
    console.log("No valid work experience data found to put.");
    return;
  }

  const batchWriteParams = {
    RequestItems: {
      [Resource.smarthrtableWorkExperience.name]: putRequests,
    },
  };

  try {
    const data = await dynamoDb.send(
      new BatchWriteItemCommand(batchWriteParams)
    );
    console.log("Batch write successful:", data);

    // Handle unprocessed items (if any)
    if (
      data.UnprocessedItems &&
      Object.keys(data.UnprocessedItems).length > 0
    ) {
      console.log(
        "Unprocessed items for employee work exp:",
        data.UnprocessedItems
      );
      // Implement retry logic for unprocessed items if needed
    }
    return data;
  } catch (error) {
    console.error("Error in batch write:", error);
    throw error;// import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
    // import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
    // import { Resource } from "sst";
    // import { logger } from "../util";
    // import { v4 } from "uuid";

    // const region = "us-east-1";
    // const s3Client = new S3Client({ region });
    // const sfnClient = new SFNClient({ region });

    // export const upload = async (formData: any, fileName?: string) => {
    //   const file = formData.get(fileName ? fileName : "file");
    //   if (!(file instanceof File)) {
    //     throw new Error("File is required");
    //   }

    //   const docId = v4();
    //   const arrayBuffer = await file.arrayBuffer();
    //   const fileContent = Buffer.from(arrayBuffer);
    //   const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";

    //   const originalKey = `${docId}.${fileExt}`;

    //   try {
    //     // Upload original file
    //     await s3Client.send(
    //       new PutObjectCommand({
    //         Bucket: Resource.shr.name,
    //         Key: originalKey,
    //         Body: fileContent,
    //         ContentType: file.type,
    //       })
    //     );

    //     // Start Step Function execution
    //     const startExecutionCommand = new StartExecutionCommand({
    //       stateMachineArn: Resource.ImageProcessingWorkflow.stateMachineArn,
    //       input: JSON.stringify({
    //         key: originalKey,
    //         bucket: Resource.shr.name,
    //       }),
    //     });

    //     const response = await sfnClient.send(startExecutionCommand);

    //     logger.info("Step Function execution started", { executionArn: response.executionArn });

    //     return {
    //       executionArn: response.executionArn,
    //       original: originalKey,
    //     };
    //   } catch (error) {
    //     logger.error("IMAGE UPLOAD ERROR", { error });
    //     throw new Error(error as any);
    //   }
    // };
  }
}

export async function batchPutEmployeeEducation(
  employeeEducation: any,
  employeeId: string
) {
  if (
    !employeeEducation ||
    employeeEducation.length === 0 ||
    employeeEducation.length > 20
  ) {
    console.log("No education data to process or data too large");
    return; // Or throw an error if needed
  }

  const putRequests = employeeEducation.reduce((acc: any, edu: any) => {
    const hasData =
      edu.level ||
      edu.institute ||
      edu.major ||
      edu.country ||
      edu.startDate ||
      edu.endDate ||
      edu.cgpa ||
      edu.graduate;

    if (hasData) {
      const item = {
        educationId: uuidv4(),
        employeeId,
        level: edu.level,
        institute: edu.institute,
        major: edu.major,
        country: edu.country,
        startDate: edu.startDate,
        endDate: edu.endDate,
        cgpa: edu.cgpa,
        graduate: edu.graduate,
        createdAt: new Date().toISOString(),
      };

      acc.push({
        PutRequest: {
          Item: marshall(item),
        },
      });
    }
    return acc;
  }, []);

  if (putRequests.length === 0) {
    console.log("No valid education data found to put.");
    return;
  }

  const batchWriteParams = {
    RequestItems: {
      [Resource.smarthrtableEducation.name]: putRequests,
    },
  };

  try {
    const data = await dynamoDb.send(
      new BatchWriteItemCommand(batchWriteParams)
    );
    console.log("Batch write successful:", data);

    // Handle unprocessed items (if any)
    if (
      data.UnprocessedItems &&
      Object.keys(data.UnprocessedItems).length > 0
    ) {
      console.log("Unprocessed items:", data.UnprocessedItems);
      // Implement retry logic for unprocessed items if needed
    }
    return data;
  } catch (error) {
    console.error("Error in batch write:", error);
    throw error;
  }
}

export async function batchPutEmployeeReferees(
  employeeReferees: any,
  employeeId: string
) {
  if (
    !employeeReferees ||
    employeeReferees.length === 0 ||
    employeeReferees.length > 20
  ) {
    console.log("No referee data to process or data too large");
    return; // Or throw an error if needed
  }

  const putRequests = employeeReferees.reduce((acc: any, ref: any) => {
    const hasData =
      ref.name ||
      ref.company ||
      ref.position ||
      ref.yearAcquainted ||
      ref.contact1 ||
      ref.contact2;

    if (hasData) {
      const item = {
        refereesId: uuidv4(),
        employeeId,
        name: ref.name,
        company: ref.company,
        position: ref.position,
        yearAcquainted: ref.yearAcquainted,
        contact1: ref.contact1,
        contact2: ref.contact2,
        createdAt: new Date().toISOString(),
      };

      acc.push({
        PutRequest: {
          Item: marshall(item),
        },
      });
    }
    return acc;
  }, []);

  if (putRequests.length === 0) {
    console.log("No valid referee data found to put.");
    return;
  }

  const batchWriteParams = {
    RequestItems: {
      [Resource.smarthrtableReferees.name]: putRequests,
    },
  };

  try {
    const data = await dynamoDb.send(
      new BatchWriteItemCommand(batchWriteParams)
    );
    console.log("Batch write successful:", data);

    // Handle unprocessed items (if any)
    if (
      data.UnprocessedItems &&
      Object.keys(data.UnprocessedItems).length > 0
    ) {
      console.log("Unprocessed items:", data.UnprocessedItems);
      // Implement retry logic for unprocessed items if needed
    }
    return data;
  } catch (error) {
    console.error("Error in batch write:", error);
    throw error;
  }
}


/**
 * Creates a new employee profile for a director
 */
export async function createEmployeeProfile(employeeData: Partial<Employee>): Promise<void> {
  await putItem(employeeData);
  logger.info(`Created employee profile for ${employeeData.employeeId}`);
}


type createUserByGroup = {
  email: string;
  password: string;
  role: UserRole;
};
export async function createUserByGroup({
  email,
  password,
  role,
}: createUserByGroup) {
  try {
    const signUpCommand = new SignUpCommand({
      ClientId: Resource.UserPoolClient.id,
      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: "custom:role",
          Value: role as UserRole, // or whatever role you want to assign
        },
      ],
    });

    const response = await cognitoClient.send(signUpCommand);
    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error creating Cognito user: ${error.message}`);
    } else {
      throw new Error(
        "Unexpected error occurred while creating Cognito user: " + error
      );
    }
  }
}