import { Amplify } from "aws-amplify";

Amplify.configure ( {
  Auth: {
    Cognito: {
      // dynamically usage
      userPoolId:import.meta.env.VITE_USER_POOL_ID ,
      userPoolClientId:import.meta.env.VITE_USER_POOL_CLIENT_ID,
      
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: "code", // or 'link'
      userAttributes: {
        email: {
          required: true,
        },
        phone_number: {
          required: false,
        },
        name: {
          required: true,
        },
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
});