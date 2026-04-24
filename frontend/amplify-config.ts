import type { ResourcesConfig } from "aws-amplify";
import Constants from "expo-constants";

const { cognitoUserPoolId, cognitoAppClientId } =
  Constants.expoConfig?.extra ?? {};

const amplifyConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: cognitoUserPoolId,
      userPoolClientId: cognitoAppClientId,
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: "code" as const,
      userAttributes: {
        email: {
          required: true,
        },
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: false,
      },
    },
  },
};

export default amplifyConfig;
