import { Amplify } from "aws-amplify";

Amplify.configure ( {
  Auth: {
    Cognito: {
      // dynamically usage
      userPoolId:import.meta.env.VITE_USER_POOL_ID,
      userPoolClientId:import.meta.env.VITE_USER_POOL_CLIENT_ID,
      
      // local devs-venture-dev-machine
      // userPoolId:import.meta.env.VITE_USER_POOL_ID || "us-east-1_ePRYKPgXN",
      // userPoolClientId:import.meta.env.VITE_USER_POOL_CLIENT_ID || "2gp6at3jl8598l0rk5lfkfm3br",
      // identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID, // Optional

      // development
      // userPoolId: import.meta.env.VITE_USER_POOL_ID || "us-east-1_Ub1k5TRRn",
      // userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || "e8pltm9rla0vl53fi2mc4haev",

      // production
      // userPoolId: import.meta.env.VITE_USER_POOL_ID || "us-east-1_ocq2WwiWf",
      // userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || "q2rd1g0me30vk59gjqiv62p6o",


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