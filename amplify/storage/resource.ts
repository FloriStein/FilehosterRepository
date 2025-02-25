import { defineStorage } from '@aws-amplify/backend';


export const storage = defineStorage({
    name: 'fileHosterStorage',
    access: (allow) => ({
        'files/*': [
            allow.authenticated.to(['read','write']),
            allow.guest.to(['read'])
        ],
    })
});