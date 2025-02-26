import { defineAuth } from '@aws-amplify/backend';

/**
 * Konfiguriert die Authentifizierungsressource für das Filehosting-Projekt.
 * Diese Funktion definiert die Anmeldeoptionen für Benutzer.
 *
 * @module authConfig
 * @requires @aws-amplify/backend
 *
 * @see {@link https://docs.amplify.aws/gen2/build-a-backend/auth} für weitere Details zur Konfiguration von Auth in AWS Amplify.
 */
export const auth = defineAuth({
  loginWith: {
    /**
     * Aktiviert die Anmeldung mit E-Mail und Passwort.
     * Wenn auf `true` gesetzt, können Benutzer sich mit ihrer E-Mail-Adresse registrieren und anmelden.
     */
    email: true,
  },
});