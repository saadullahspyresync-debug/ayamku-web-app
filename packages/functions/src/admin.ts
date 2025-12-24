


// // import { Handler, APIGatewayProxyEvent } from "aws-lambda";
// // import { Resource } from "sst";

// // export const main: Handler = async (event: APIGatewayProxyEvent) => {

// //   // const dbHost = `${Resource.temp1.ec2PrivateIp}:3000`;
// //   // const dbHost = `http://98.81.104.4:3000`;
// //   const dbHost = `http://172.31.17.219:3000`;

// //   console.log({ dbHost })

// //   const response = await fetch(dbHost);
// //   const result = await response.text();
// //   console.log({ result })

// //   return {
// //     statusCode: 200,
// //     body: JSON.stringify({
// //       message: "Successfully connected to PostgreSQL",
// //       timestamp: result,
// //     }),
// //   };
// // };

// import { Handler, APIGatewayProxyEvent } from "aws-lambda";
// import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
// import { Resource } from "sst";
// import { createCognitoUser } from "../../core/src/services/user";
// const { DynamoDB } = require('@aws-sdk/client-dynamodb');

// const {
//   DynamoDBDocument,
//   GetCommand,
//   PutCommand,
//   UpdateCommand,
//   QueryCommand,
//   TransactWriteCommand
// } = require('@aws-sdk/lib-dynamodb');
// const { v4: uuidv4 } = require('uuid');

// // Initialize DynamoDB client
// const dynamoDb = DynamoDBDocument.from(new DynamoDB({ region: 'us-east-1' }));

// export const main: Handler = async (event: APIGatewayProxyEvent) => {

//   // createHrResources()
//   //   .then(result => console.log("Operation completed:", JSON.stringify(result, null, 2)))
//   //   .catch(error => console.error("Operation failed:", error));
//   // return;

//   const dynamoDbClient = new DynamoDBClient();

//   if (!event.body) {
//     return {
//       statusCode: 400,
//       body: JSON.stringify({ error: "Invalid request, no body found" }),
//     };
//   }

//   let data;
//   try {
//     data = JSON.parse(event.body.trim());
//   } catch (error) {
//     console.error("Error parsing JSON:", error);
//     return {
//       statusCode: 400,
//       body: JSON.stringify({ error: "Invalid JSON format" }),
//     };
//   }

//   let userId: string | null = null;
//   console.log(data);
//   try {

//     const response = await createCognitoUser({
//       email: data.email,
//       password: data.password,
//       role: 'Admin'
//     })
//     userId = String(response.UserSub);

//     const putItemCommand = new PutItemCommand({
//       TableName: Resource.smarthrtable.name,
//       Item: {
//         PK: { S: `EMPLOYEE#${userId}` },
//         SK: { S: "PROFILE" },
//         employeeId: { S: `EMPLOYEE#${userId}` },
//         email: { S: data?.email || '' },
//         firstName: { S: data?.firstName || '' },
//         lastName: { S: data?.lastName || '' },
//         role: { S: "Admin" },
//       },
//     });
//     await dynamoDbClient.send(putItemCommand);

//     return {
//       statusCode: 200,
//       body: JSON.stringify({
//         employeeId: userId,
//         email: data.email,
//         firstName: data.firstName,
//         lastName: data.lastName,
//         role: "Admin",
//       }),
//       headers: {
//         "Access-Control-Allow-Origin": "*", // Set PK as Employee ID
//         "Access-Control-Allow-Credentials": true,
//       },
//     };

//   } catch (error: unknown) {
//     console.log("ERROR DURING ADMIN CREATION: ", { error })
//     return {
//       statusCode: 500,
//       body: JSON.stringify({ error: error }),
//     };
//   }
// };

// // Helper function to generate dates between two dates
// const getDatesBetween = (startDate, endDate) => {
//   const start = new Date(startDate);
//   const end = new Date(endDate);
//   const dateArray = [];
//   let currentDate = new Date(start);

//   while (currentDate <= end) {
//     dateArray.push(currentDate.toISOString().split('T')[0]); // YYYY-MM-DD format
//     currentDate.setDate(currentDate.getDate() + 1);
//   }

//   return dateArray;
// };

// // Error and success response formatters
// const errorResponse = (context, { message, error }) => {
//   console.error(message, error);
//   return {
//     statusCode: 400,
//     body: JSON.stringify({
//       success: false,
//       message,
//       error: error ? JSON.stringify(error) : undefined
//     })
//   };
// };

// const successResponse = (context, { data, status, message }) => {
//   return {
//     statusCode: 200,
//     body: JSON.stringify({
//       success: status || true,
//       message,
//       data
//     })
//   };
// };

// // Main function to create all HR resources
// const createHrResources = async () => {
//   try {
//     console.log("Starting HR resource creation process...");

//     // Step 1: Create Company with Director
//     const companyResult = await createCompanyWithDirector();
//     const { companyId, directorId } = companyResult;
//     console.log(`Company created with ID: ${companyId}, Director ID: ${directorId}`);

//     // Step 2: Create Branch with Manager
//     const branchResult = await createBranchWithManager(companyId);
//     const { branchId } = branchResult;
//     console.log(`Branch created with ID: ${branchId} for Company: ${companyId}`);

//     // Step 3: Create Department
//     const departmentResult = await createDepartmentInBranch(branchId);
//     const { departmentId } = departmentResult;
//     console.log(`Department created with ID: ${departmentId} for Branch: ${branchId}`);

//     // Step 5: Create Employee
//     const employeeResult = await createEmployeeForCompany(companyId, branchId, departmentId);
//     const { employeeId } = employeeResult;
//     console.log(`Employee created with ID: ${employeeId} for Company: ${companyId}`);

//     // Step 4: Create Shift for Department
//     const shiftResult = await createShiftForDepartment(departmentId, companyId, branchId, directorId, employeeId);
//     const { shiftId } = shiftResult;
//     console.log(`Shift created with ID: ${shiftId} for Department: ${departmentId}`);

//     // Step 6: Assign Employee to Shift
//     const assignmentResult = await assignEmployeeToShift(employeeId, shiftId);
//     console.log(`Employee ${employeeId} assigned to Shift ${shiftId}`);

//     return {
//       success: true,
//       data: {
//         companyId,
//         directorId,
//         branchId,
//         departmentId,
//         shiftId,
//         employeeId,
//         assignmentResult
//       },
//       message: "All HR resources created successfully"
//     };
//   } catch (error) {
//     console.error("Error in HR resource creation process:", error);
//     return {
//       success: false,
//       message: "Failed to create HR resources",
//       error: error.message
//     };
//   }
// };

// // Step 1: Create Company with Director
// const createCompanyWithDirector = async () => {
//   // Dummy data for company and director
//   const companyData = {
//     companyName: "Acme Corporation",
//     ownerName: "John Doe",
//     businessNumber: "BN-12345678",
//     businessIndustry: "Technology",
//     registrationDate: "2025-03-01",
//     email: "info@acmecorp.com",
//     phoneNumber: "1234567890",
//     mobileNumber: "1987654321",
//     fax: "1122334455",
//     website: "https://acmecorp.com",
//     language: "English",
//     companyDescription: "Leading technology solutions provider",
//     companyAddress: "123 Tech Boulevard",
//     city: "Silicon Valley",
//     stateProvince: "California",
//     country: "USA",
//     zipCode: "94000",
//     status: "active",
//     director: {
//       fullName: "John Doe",
//       directorEmail: "john.doe@acmecorp.com",
//       password: "SecurePass123!",
//       gender: "Male",
//       placeOfBirth: "New York",
//       dateOfBirth: "1980-01-15",
//       nationality: "American",
//       religion: "Prefer not to say",
//       race: "Prefer not to say",
//       icPassport: "AB12345678",
//       joiningDate: "2025-03-01",
//       icColor: "Blue"
//     }
//   };

//   const companyId = `COMPANY#${uuidv4()}`;
//   let directorId;

//   // Create Cognito user for the director
//   try {
//     const { UserSub } = await createCognitoUser({
//       email: companyData.director.directorEmail,
//       password: companyData.director.password,
//       role: 'Director'
//     });
//     directorId = `EMPLOYEE#${UserSub}`;
//   } catch (error) {
//     throw new Error(`Error creating director user: ${error.message}`);
//   }

//   // Create director profile in DynamoDB
//   await dynamoDb.send(new PutCommand({
//     TableName: Resource.smarthrtable.name,
//     Item: {
//       PK: directorId,
//       SK: "PROFILE",
//       employeeId: directorId,
//       entityType: "EMPLOYEE",
//       firstName: companyData.director.fullName,
//       email: companyData.director.directorEmail,
//       role: "Director",
//       companies: [companyId],
//       createdAt: new Date().toISOString(),
//       status: 'active',
//       gender: companyData.director.gender || '',
//       pob: companyData.director.placeOfBirth,
//       dob: companyData.director.dateOfBirth || '',
//       nationality: companyData.director.nationality,
//       religion: companyData.director.religion || '',
//       race: companyData.director.race || '',
//       icNumber: companyData.director.icPassport,
//       joiningDate: companyData.director.joiningDate || '',
//       icColor: companyData.director.icColor || '',
//       company: companyId
//     }
//   }));

//   // Store company in DynamoDB
//   await dynamoDb.send(new PutCommand({
//     TableName: Resource.smarthrtable.name,
//     Item: {
//       PK: companyId,
//       SK: "PROFILE",
//       entityType: "COMPANY",
//       company: companyId,
//       name: companyData.companyName,
//       directorIds: [directorId],
//       createdAt: new Date().toISOString(),
//       status: companyData.status || 'active',
//       profileImage: '',
//       bannerImage: '',
//       companyName: companyData.companyName,
//       ownerName: companyData.ownerName,
//       businessNumber: companyData.businessNumber,
//       businessIndustry: companyData.businessIndustry || '',
//       registrationDate: companyData.registrationDate || '',
//       email: companyData.email,
//       phoneNumber: companyData.phoneNumber,
//       mobileNumber: companyData.mobileNumber,
//       fax: companyData.fax,
//       website: companyData.website || '',
//       language: companyData.language || '',
//       companyDescription: companyData.companyDescription || '',
//       companyAddress: companyData.companyAddress || '',
//       city: companyData.city || '',
//       stateProvince: companyData.stateProvince || '',
//       country: companyData.country || '',
//       zipCode: companyData.zipCode || '',
//       ownerId: directorId
//     }
//   }));

//   return { companyId, directorId };
// };

// // Step 2: Create Branch with Manager
// const createBranchWithManager = async (companyId) => {
//   // Dummy data for branch and manager
//   const branchData = {
//     branchName: "Downtown Office",
//     address: "456 Business Avenue, Downtown",
//     phoneNumber: "1212343456",
//     companyId: companyId,
//     email: "downtown@acmecorp.com",
//     managerName: "Jane Smith",
//     managerEmail: "jane.smith@acmecorp.com",
//     password: "Manager123!",
//     race: "Asian",
//     religion: "Islam",
//     maritalStatus: "Single",
//     nationality: "American",
//     creationDate: "2025-03-05",
//     icPassport: "CD87654321",
//     gender: "Female",
//     status: "active"
//   };

//   // Register manager in Cognito
//   let managerId;
//   try {
//     const { UserSub } = await createCognitoUser({
//       email: branchData.managerEmail,
//       password: branchData.password,
//       role: "Manager"
//     });
//     managerId = UserSub;
//   } catch (error) {
//     throw new Error(`Error creating manager user: ${error.message}`);
//   }

//   // Create branch and manager profiles
//   const branchId = `BRANCH#${uuidv4()}`;

//   // Prepare branch profile
//   const branchProfile = {
//     PK: companyId,
//     SK: branchId,
//     entityType: "BRANCH",
//     branchId: branchId,
//     managerId: `EMPLOYEE#${managerId}`,
//     branchName: branchData.branchName,
//     address: branchData.address,
//     phoneNumber: branchData.phoneNumber,
//     companyId: branchData.companyId,
//     email: branchData.email,
//     status: branchData.status,
//     createdAt: new Date().toISOString()
//   };

//   // Prepare manager profile
//   const managerProfile = {
//     PK: `EMPLOYEE#${managerId}`,
//     SK: "PROFILE",
//     entityType: "EMPLOYEE",
//     employeeId: managerId,
//     branch: branchId,
//     company: companyId,
//     firstName: branchData.managerName,
//     email: branchData.managerEmail,
//     gender: branchData.gender || "",
//     maritalStatus: branchData.maritalStatus || "",
//     joiningDate: new Date(branchData.creationDate).toISOString(),
//     nationality: branchData.nationality || "",
//     religion: branchData.religion || "",
//     race: branchData.race || "",
//     icNumber: branchData.icPassport,
//     status: "active",
//     role: "Manager",
//     createdAt: new Date().toISOString()
//   };

//   // Perform transactional write
//   await dynamoDb.send(new TransactWriteCommand({
//     TransactItems: [
//       {
//         Put: {
//           TableName: Resource.smarthrtable.name,
//           Item: branchProfile
//         }
//       },
//       {
//         Put: {
//           TableName: Resource.smarthrtable.name,
//           Item: managerProfile
//         }
//       }
//     ]
//   }));

//   return { branchId, managerId };
// };

// // Step 3: Create Department in Branch
// const createDepartmentInBranch = async (branchId) => {
//   // Dummy data for department
//   const departmentData = {
//     departmentName: "Engineering",
//     status: "active",
//     branchId: branchId
//   };

//   const departmentId = `DEPARTMENT#${uuidv4()}`;
//   const departmentProfile = {
//     PK: branchId,
//     SK: departmentId,
//     entityType: "DEPARTMENT",
//     departmentId: departmentId,
//     name: departmentData.departmentName,
//     status: departmentData.status,
//     branchId: departmentData.branchId,
//     createdAt: new Date().toISOString()
//   };

//   await dynamoDb.send(new PutCommand({
//     TableName: Resource.smarthrtable.name,
//     Item: departmentProfile
//   }));

//   return { departmentId };
// };

// // Step 4: Create Shift for Department
// const createShiftForDepartment = async (departmentId, companyId, branchId, directorId, employeeId) => {
//   // Dummy data for shift
//   const shiftData = {
//     departmentIds: [departmentId],
//     companyId: companyId,
//     branchId: branchId,
//     shiftType: "Morning",
//     assignedBy: directorId,
//     shiftStartTime: "2025-03-10T09:00:00",
//     shiftEndTime: "2025-03-10T17:00:00",
//     breakStartTime: "2025-03-10T12:00:00",
//     breakEndTime: "2025-03-10T13:00:00",
//     overTimeStart: "2025-03-10T17:00:00",
//     overTimeEnd: "2025-03-10T19:00:00",
//     additionalNotes: "Standard work shift with overtime available",
//     assignedDateFrom: "2025-03-10",
//     assignedDateTo: "2025-03-20",
//     holidays: ["sunday"]
//   };

//   const shiftId = `SHIFT#${uuidv4()}`;
//   const shiftProfile = {
//     PK: shiftId,
//     SK: "PROFILE",
//     shiftId: shiftId,
//     departmentId: departmentId,
//     companyId: companyId,
//     branchId: branchId,
//     date: new Date(shiftData.assignedDateFrom).toISOString().split('T')[0],
//     employeeId: employeeId,
//     shiftType: shiftData.shiftType,
//     assignedBy: shiftData.assignedBy,
//     shiftStartTime: new Date(shiftData.shiftStartTime).toISOString(),
//     shiftEndTime: new Date(shiftData.shiftEndTime).toISOString(),
//     breakStartTime: new Date(shiftData.breakStartTime).toISOString(),
//     breakEndTime: new Date(shiftData.breakEndTime).toISOString(),
//     overTimeStart: new Date(shiftData.overTimeStart).toISOString(),
//     overTimeEnd: new Date(shiftData.overTimeEnd).toISOString(),
//     additionalNotes: shiftData.additionalNotes,
//     holidays: shiftData.holidays,
//     assignedDateFrom: new Date(shiftData.assignedDateFrom).toISOString(),
//     assignedDateTo: new Date(shiftData.assignedDateTo).toISOString(),
//     createdAt: new Date().toISOString()
//   };

//   await dynamoDb.send(new PutCommand({
//     TableName: Resource.smarthrtable.name,
//     Item: shiftProfile
//   }));

//   // Create shift assignments for each date
//   const dates = getDatesBetween(shiftData.assignedDateFrom, shiftData.assignedDateTo);
//   const shiftAssignmentItems = dates.map(date => ({
//     Put: {
//       TableName: Resource.smarthrtable.name,
//       Item: {
//         ...shiftProfile,
//         PK: shiftId,
//         SK: `SHIFT_ASSIGNMENT#${date}`
//       }
//     }
//   }));

//   // Process in chunks of 100 (DynamoDB transaction limit)
//   const chunkSize = 100;
//   for (let i = 0; i < shiftAssignmentItems.length; i += chunkSize) {
//     const chunk = shiftAssignmentItems.slice(i, i + chunkSize);
//     await dynamoDb.send(new TransactWriteCommand({
//       TransactItems: chunk
//     }));
//   }

//   return { shiftId };
// };

// // Step 5: Create Employee
// const createEmployeeForCompany = async (companyId, branchId, departmentId) => {
//   // Dummy data for employee
//   const employeeData = {
//     firstName: "Robert",
//     lastName: "Johnson",
//     email: "robert.johnson@acmecorp.com",
//     profileImage: "",
//     dob: "1990-05-20",
//     pob: "Chicago",
//     nationality: "American",
//     gender: "Male",
//     maritalStatus: "Married",
//     race: "Asian",
//     religion: "Islam",
//     company: companyId,
//     branch: branchId,
//     department: departmentId,
//     joiningDate: "2025-03-08",
//     icNumber: "EF12345678",
//     icColor: "Yellow",
//     role: "Employee"
//   };

//   // Create Cognito user for employee
//   const { UserSub } = await createCognitoUser({
//     email: employeeData.email,
//     password: "Employee123!",
//     role: employeeData?.role || 'Employee'
//   });

//   const employeeId = UserSub;

//   const VALID_LEAVE_TYPES = [
//     'medical',
//     'emergency',
//     'maternity',
//     'annual',
//     'unpaid'
//   ];

//   // Dynamically generate flattened leave structure
//   const leaveAttributes = VALID_LEAVE_TYPES.reduce((acc, type) => {
//     const camelCaseType = `${type}Leave`; // Example: "medicalLeave"
//     acc[`${camelCaseType}Allocated`] = 10; // Default allocated
//     acc[`${camelCaseType}Used`] = 0;      // Default used
//     acc[`${camelCaseType}Remaining`] = 10;      // Default remaining
//     return acc;
//   }, {} as Record<string, number>);

//   // Create employee profile
//   const employeeProfile = {
//     PK: `EMPLOYEE#${employeeId}`,
//     SK: "PROFILE",
//     entityType: "EMPLOYEE",
//     employeeId: `EMPLOYEE#${employeeId}`,
//     firstName: employeeData.firstName,
//     profileImage: employeeData.profileImage || "",
//     lastName: employeeData.lastName || "",
//     email: employeeData.email,
//     dob: employeeData.dob || "",
//     pob: employeeData.pob || "",
//     nationality: employeeData.nationality,
//     gender: employeeData.gender,
//     maritalStatus: employeeData.maritalStatus,
//     race: employeeData.race,
//     religion: employeeData.religion,
//     company: employeeData.company,
//     branch: employeeData.branch,
//     department: employeeData.department,
//     joiningDate: employeeData.joiningDate,
//     icNumber: employeeData.icNumber,
//     ...leaveAttributes,
//     icColor: employeeData.icColor,
//     status: "active",
//     role: employeeData.role,
//     createdAt: new Date().toISOString()
//   };

//   await dynamoDb.send(new PutCommand({
//     TableName: Resource.smarthrtable.name,
//     Item: employeeProfile
//   }));

//   return { employeeId: `EMPLOYEE#${employeeId}` };
// };

// // Step 6: Assign Employee to Shift
// const assignEmployeeToShift = async (employeeId, shiftId) => {
//   // Query the shift to get assignment dates
//   const shiftParams = {
//     TableName: Resource.smarthrtable.name,
//     KeyConditionExpression: "PK = :shiftId AND SK = :profile",
//     ExpressionAttributeValues: {
//       ":shiftId": shiftId,
//       ":profile": "PROFILE"
//     }
//   };

//   const shiftResult = await dynamoDb.send(new QueryCommand(shiftParams));
//   if (!shiftResult.Items || shiftResult.Items.length === 0) {
//     throw new Error("Shift not found");
//   }

//   const shift = shiftResult.Items[0];
//   const { assignedDateFrom, assignedDateTo } = shift;

//   // Update employee profile to include the shift
//   await dynamoDb.send(new UpdateCommand({
//     TableName: Resource.smarthrtable.name,
//     Key: {
//       PK: employeeId,
//       SK: "PROFILE"
//     },
//     UpdateExpression: "SET shiftIds = list_append(if_not_exists(shiftIds, :emptyList), :newShiftIdList)",
//     ExpressionAttributeValues: {
//       ":newShiftIdList": [shiftId],
//       ":emptyList": []
//     }
//   }));

//   return {
//     success: true,
//     message: "Employee assigned to shift successfully",
//     data: {
//       employeeId,
//       shiftId,
//       assignedDateFrom,
//       assignedDateTo
//     }
//   };
// };

// // For direct execution
// // createHrResources()
// //   .then(result => console.log("Operation completed:", JSON.stringify(result, null, 2)))
// //   .catch(error => console.error("Operation failed:", error));

// packages/functions/src/admin.main.ts

import { Handler, APIGatewayProxyEvent } from "aws-lambda";
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminDeleteUserCommand,
  AdminUpdateUserAttributesCommand,
  MessageActionType,
} from "@aws-sdk/client-cognito-identity-provider";
import { Resource } from "sst";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = "us-east-1";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const cognitoClient = new CognitoIdentityProviderClient({ region });

interface CreateAdminRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  [key: string]: any;
}

interface UpdateAdminRequest {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface DeleteAdminRequest {
  userId: string;
}

// ==================== Helper Functions ====================

/**
 * Creates a Cognito user with Admin role
 */
const createCognitoUser = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<string> => {
  try {
    // Create user in Cognito
    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: Resource.UserPool.id,
      Username: email,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" },
        { Name: "custom:role", Value: "Admin" },
        { Name: "given_name", Value: firstName },
        { Name: "family_name", Value: lastName },
      ],
      MessageAction: MessageActionType.SUPPRESS, // Don't send welcome email
      TemporaryPassword: password,
    });

    const createResponse = await cognitoClient.send(createUserCommand);
    const userId = createResponse.User?.Username;

    if (!userId) {
      throw new Error("Failed to retrieve user ID from Cognito response");
    }

    // Set permanent password (skip temp password flow)
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: Resource.UserPool.id,
      Username: email,
      Password: password,
      Permanent: true,
    });
    await cognitoClient.send(setPasswordCommand);

    // Add user to Admin group
    const addToGroupCommand = new AdminAddUserToGroupCommand({
      UserPoolId: Resource.UserPool.id,
      Username: email,
      GroupName: "Admin",
    });
    await cognitoClient.send(addToGroupCommand);

    console.log(`Cognito user created: ${userId}, added to Admin group`);

    // Get the actual Cognito sub (UUID) for userId
    const userAttributes = createResponse.User?.Attributes || [];
    const subAttribute = userAttributes.find((attr) => attr.Name === "sub");
    const cognitoSub = subAttribute?.Value || userId;

    return cognitoSub;
  } catch (error: any) {
    throw new Error(`Cognito user creation failed: ${error.message}`);
  }
};

/**
 * Creates Admin profile in DynamoDB User table
 */
const createAdminInDynamoDB = async (
  userId: string,
  data: CreateAdminRequest
): Promise<void> => {
  const putItemCommand = new PutItemCommand({
    TableName: Resource.User.name,
    Item: {
      userId: { S: userId },
      email: { S: data.email },
      firstName: { S: data.firstName },
      lastName: { S: data.lastName },
      role: { S: "Admin" },
      status: { S: "active" },
      createdAt: { S: new Date().toISOString() },
      updatedAt: { S: new Date().toISOString() },
    },
  });
  await dynamoDb.send(putItemCommand);
  // console.log(`Admin profile created in DynamoDB: ${userId}`);
};

/**
 * Retrieves Admin from DynamoDB by userId
 */
const getAdminFromDynamoDB = async (userId: string): Promise<any> => {
  const getItemCommand = new GetItemCommand({
    TableName: Resource.User.name,
    Key: {
      userId: { S: userId },
    },
  });

  const response = await dynamoDb.send(getItemCommand);

  if (!response.Item) {
    throw new Error(`Admin with ID ${userId} not found`);
  }

  return {
    userId: response.Item.userId?.S,
    email: response.Item.email?.S,
    firstName: response.Item.firstName?.S,
    lastName: response.Item.lastName?.S,
    role: response.Item.role?.S,
    status: response.Item.status?.S,
    createdAt: response.Item.createdAt?.S,
    updatedAt: response.Item.updatedAt?.S,
  };
};

/**
 * Retrieves Admin from DynamoDB by email using GSI
 */
const getAdminByEmail = async (email: string): Promise<any> => {
  const queryCommand = new QueryCommand({
    TableName: Resource.User.name,
    IndexName: "emailIndex",
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: {
      ":email": { S: email },
    },
  });

  const response = await dynamoDb.send(queryCommand);

  if (!response.Items || response.Items.length === 0) {
    throw new Error(`Admin with email ${email} not found`);
  }

  const item = response.Items[0];
  return {
    userId: item.userId?.S,
    email: item.email?.S,
    firstName: item.firstName?.S,
    lastName: item.lastName?.S,
    role: item.role?.S,
    status: item.status?.S,
    createdAt: item.createdAt?.S,
    updatedAt: item.updatedAt?.S,
  };
};

/**
 * Updates Admin in DynamoDB
 */
const updateAdminInDynamoDB = async (
  userId: string,
  updates: UpdateAdminRequest
): Promise<void> => {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  if (updates.firstName) {
    updateExpressions.push("#firstName = :firstName");
    expressionAttributeNames["#firstName"] = "firstName";
    expressionAttributeValues[":firstName"] = { S: updates.firstName };
  }

  if (updates.lastName) {
    updateExpressions.push("#lastName = :lastName");
    expressionAttributeNames["#lastName"] = "lastName";
    expressionAttributeValues[":lastName"] = { S: updates.lastName };
  }

  if (updates.email) {
    updateExpressions.push("#email = :email");
    expressionAttributeNames["#email"] = "email";
    expressionAttributeValues[":email"] = { S: updates.email };
  }

  updateExpressions.push("#updatedAt = :updatedAt");
  expressionAttributeNames["#updatedAt"] = "updatedAt";
  expressionAttributeValues[":updatedAt"] = { S: new Date().toISOString() };

  const updateItemCommand = new UpdateItemCommand({
    TableName: Resource.User.name,
    Key: {
      userId: { S: userId },
    },
    UpdateExpression: `SET ${updateExpressions.join(", ")}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  });

  await dynamoDb.send(updateItemCommand);
};

/**
 * Updates Admin in Cognito
 */
const updateAdminInCognito = async (
  email: string,
  updates: UpdateAdminRequest
): Promise<void> => {
  const attributes: Array<{ Name: string; Value: string }> = [];

  if (updates.firstName) {
    attributes.push({ Name: "given_name", Value: updates.firstName });
  }

  if (updates.lastName) {
    attributes.push({ Name: "family_name", Value: updates.lastName });
  }

  if (attributes.length > 0) {
    const updateCommand = new AdminUpdateUserAttributesCommand({
      UserPoolId: Resource.UserPool.id,
      Username: email,
      UserAttributes: attributes,
    });

    await cognitoClient.send(updateCommand);
  }
};

/**
 * Deletes Admin from DynamoDB
 */
const deleteAdminFromDynamoDB = async (userId: string): Promise<void> => {
  const deleteItemCommand = new DeleteItemCommand({
    TableName: Resource.User.name,
    Key: {
      userId: { S: userId },
    },
  });

  await dynamoDb.send(deleteItemCommand);
};

/**
 * Deletes Admin from Cognito
 */
const deleteAdminFromCognito = async (email: string): Promise<void> => {
  const deleteCommand = new AdminDeleteUserCommand({
    UserPoolId: Resource.UserPool.id,
    Username: email,
  });

  await cognitoClient.send(deleteCommand);
};

// ==================== Route Handlers ====================

/**
 * POST /admin - Create new Admin
 */
const handleCreateAdmin = async (data: CreateAdminRequest, headers: any) => {
  console.log("Creating Admin user...");

  // Validate required fields
  const requiredFields = ["email", "password", "firstName", "lastName"];
  const missingFields = requiredFields.filter((field) => !data[field]);

  if (missingFields.length > 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: `Missing required fields: ${missingFields.join(", ")}`,
      }),
    };
  }

  let userId: string | null = null;

  try {
    // Step 1: Create Cognito user (returns Cognito sub UUID)
    userId = await createCognitoUser(
      data.email,
      data.password,
      data.firstName,
      data.lastName
    );

    // Step 2: Create DynamoDB profile
    await createAdminInDynamoDB(userId, data);

    // Step 3: Return success response
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: "Admin user created successfully",
        data: {
          userId: userId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: "Admin",
        },
      }),
    };
  } catch (error: any) {
    console.error("ERROR DURING ADMIN CREATION:", error);

    // Cleanup: If DynamoDB write failed but Cognito user was created
    if (userId) {
      console.error(
        `Attempting to cleanup Cognito user ${userId} due to DynamoDB failure...`
      );
      try {
        await deleteAdminFromCognito(data.email);
      } catch (cleanupError) {
        console.error("Cleanup failed:", cleanupError);
      }
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to create Admin user",
        message: error.message,
      }),
    };
  }
};

/**
 * GET /admin/:userId - Get Admin details
 */
const handleGetAdmin = async (event: APIGatewayProxyEvent, headers: any) => {

  const userId = event.pathParameters?.userId;

  if (!userId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: "Missing userId parameter",
      }),
    };
  }

  try {
    const admin = await getAdminFromDynamoDB(userId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Admin retrieved successfully",
        data: admin,
      }),
    };
  } catch (error: any) {
    console.error("ERROR GETTING ADMIN:", error);
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        error: "Admin not found",
        message: error.message,
      }),
    };
  }
};

/**
 * PUT /admin - Update Admin
 */
const handleUpdateAdmin = async (data: UpdateAdminRequest, headers: any) => {
  console.log("Updating Admin user...");

  if (!data.userId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: "Missing userId",
      }),
    };
  }

  try {
    // Get current admin data
    const currentAdmin = await getAdminFromDynamoDB(data.userId);

    // Update DynamoDB
    await updateAdminInDynamoDB(data.userId, data);

    // Update Cognito if name fields changed
    if (data.firstName || data.lastName) {
      await updateAdminInCognito(currentAdmin.email, data);
    }

    // Get updated data
    const updatedAdmin = await getAdminFromDynamoDB(data.userId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Admin updated successfully",
        data: updatedAdmin,
      }),
    };
  } catch (error: any) {
    console.error("ERROR UPDATING ADMIN:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to update Admin",
        message: error.message,
      }),
    };
  }
};

/**
 * DELETE /admin - Delete Admin
 */
const handleDeleteAdmin = async (data: DeleteAdminRequest, headers: any) => {

  if (!data.userId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: "Missing userId",
      }),
    };
  }

  try {
    // Get admin email before deletion
    const admin = await getAdminFromDynamoDB(data.userId);

    // Delete from Cognito first
    await deleteAdminFromCognito(admin.email);

    // Delete from DynamoDB
    await deleteAdminFromDynamoDB(data.userId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Admin deleted successfully",
        data: {
          userId: data.userId,
        },
      }),
    };
  } catch (error: any) {
    console.error("ERROR DELETING ADMIN:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to delete Admin",
        message: error.message,
      }),
    };
  }
};

// ==================== Main Lambda Handler ====================

export const main = async (event: APIGatewayProxyEvent): Promise<any> => {

  console.log("🚀 ADMIN MAIN INVOKED");

  const httpMethod =
  event.httpMethod || event.requestContext?.http?.method || "UNKNOWN";


  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Methods": "POST, GET, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle OPTIONS request for CORS
  if (httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  try {

    // Validate request body for POST/PUT/DELETE
    if (!event.body && httpMethod !== "GET") {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Invalid request: missing request body",
        }),
      };
    }

    let data: any = null;
    if (event.body) {
      try {
        data = JSON.parse(event.body.trim());
      } catch (error) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: "Invalid JSON format",
          }),
        };
      }
    }
// console.log("🔹 Data parsed:", data);
// console.log("🔹 HTTP Method:", httpMethod);


    // Route to appropriate handler
    switch (httpMethod) {
      case "POST":
        return await handleCreateAdmin(data, corsHeaders);
      case "GET":
        return await handleGetAdmin(event, corsHeaders);
      case "PUT":
        return await handleUpdateAdmin(data, corsHeaders);
      case "DELETE":
        return await handleDeleteAdmin(data, corsHeaders);
      default:
        return {
          statusCode: 405,
          headers: corsHeaders,
          body: JSON.stringify({
            error: "Method not allowed",
          }),
        };
    }
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
    };
  }
};
