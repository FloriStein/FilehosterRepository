import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a
    .schema({
      MetaData: a
          .model({
              fileName: a.string().required(),
              path: a.url().required(),
              bucket: a.string().required(),
              uploadedAt: a.datetime().required(),
              size: a.integer().required()
            }).identifier(["fileName"])
    })
    .authorization((allow) => [allow.publicApiKey()]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
    logging: {
        excludeVerboseContent: false,
        fieldLogLevel: 'all',
        retention: '1 month'
    }
});
