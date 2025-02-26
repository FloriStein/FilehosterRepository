import { defineStorage } from '@aws-amplify/backend';

/**
 * Konfiguriert den Speicher für das Filehosting-Projekt.
 * Definiert die Zugriffsrechte für authentifizierte und Gastbenutzer.
 *
 * @module storageConfig
 * @requires @aws-amplify/backend
 */

export const storage = defineStorage({
    /**
     * Name des Speichers innerhalb des Projekts
     */
    name: 'fileHosterStorage',

    /**
     * Definiert die Zugriffskontrolle für gespeicherte Dateien.
     * Authentifizierte Benutzer können lesen und schreiben,
     * Gäste können nur lesen.
     */
    access: (allow) => ({
        'files/*': [
            allow.authenticated.to(['read','write']),
            allow.guest.to(['read'])
        ],
    }),
});
