import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/**
 * Definiert das Datenmodell für die Metadaten von hochgeladenen Dateien
 * und konfiguriert die Autorisierungsmodi sowie das Logging für das Backend.
 *
 * @module dataConfig
 * @requires @aws-amplify/backend
 */

/**
 * Definiert das Datenbankschema für die Speicherung von Datei-Metadaten.
 * Jedes Modell enthält wichtige Informationen über hochgeladene Dateien.
 */
const schema = a
    .schema({
        MetaData: a
            .model({
                /** Der Name der Datei */
                fileName: a.string().required(),
                /** Der Speicherpfad der Datei */
                path: a.string().required(),
                /** Der S3-Bucket, in dem die Datei gespeichert ist */
                bucket: a.string().required(),
                /** Zeitstempel des Uploads */
                uploadedAt: a.datetime().required(),
                /** Größe der Datei in Bytes */
                size: a.integer().required()
            }).identifier(["fileName"])
    }).authorization((allow) => [allow.publicApiKey()]);

/**
 * Typ für das definierte Schema basierend auf ClientSchema
 */
export type Schema = ClientSchema<typeof schema>;

/**
 * Konfiguriert die Datenverarbeitung und Autorisierung für die Amplify API.
 */
export const data = defineData({
    schema,
    authorizationModes: {
        /** Standardmäßige Autorisierungsmethode */
        defaultAuthorizationMode: "apiKey",
        apiKeyAuthorizationMode: {
            /** Ablaufzeit für API-Schlüssel in Tagen */
            expiresInDays: 30,
        },
    },
    logging: {
        /** Gibt an, ob detaillierte Logs ausgeschlossen werden sollen */
        excludeVerboseContent: false,
        /** Legt die Protokollstufe für Felder fest */
        fieldLogLevel: 'all',
        /** Dauer der Log-Aufbewahrung */
        retention: '1 month'
    }
});