import type { ResourcesConfig } from "aws-amplify";

const amplifyConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: "eu-north-1_vg5paRmeJ",
      userPoolClientId: "61t6bc8ss4va75bkn2kbf0s453",
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
