import { createRequire } from "module";
import type { database, auth, ServiceAccount } from "firebase-admin";

const require = createRequire(import.meta.url);

let admin: typeof import("firebase-admin") | null = null;
try {
  admin = require("firebase-admin");
} catch (error) {
  console.warn("Firebase Admin SDK not available in this environment");
}

function loadServiceAccount(): ServiceAccount {
  const jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
      return {
        projectId: String(parsed.project_id ?? parsed.projectId ?? ""),
        clientEmail: String(parsed.client_email ?? parsed.clientEmail ?? ""),
        privateKey: String(parsed.private_key ?? parsed.privateKey ?? ""),
      };
    } catch (error) {
      console.error(
        "FIREBASE_SERVICE_ACCOUNT is not valid JSON:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();

  if (clientEmail && privateKey && projectId) {
    return { client_email: clientEmail, private_key: privateKey, project_id: projectId } as unknown as ServiceAccount;
  }

  return {
    projectId: "last-197cd",
    clientEmail: "firebase-adminsdk-duxqh@last-197cd.iam.gserviceaccount.com",
    privateKey:
      "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDZWMqnp+ibmEsR\nEk/Lq2IpXn4j+TxwXtxPW3JPeuiLYLAVSGSBhVjladx887yM4aXEFNMhUEj0HMG0\nON9UhcmmyvAY/ecoFFAVpqEhWB58K48XbGHoQMaaaDTupp+KLoYIr41zhxMBTR4b\nWSgxRRPHVu2XjjfzhJAgTqKWpItJ7pPxu4eCRwQwrFofmrG0stgv9LwXLaNV9ghf\nATHiif13iQiFdzPYYanw28Zssmsge+65HbLSEALnjEcJJpAB1Cf4FqtXQE30U2MB\nDjMns8iAQnCyFqFmLTYURxMaOfRUkJdrKof/NRpkV2TcNo6NijY+NWqNAKUmjwkr\n2EsACz1fAgMBAAECggEAFVKiMxeEePtUZfzbajpKm49jJalWdhnAWGK60LRYqw/V\nxoi/H3vTEFK16GZLGbErf5Shb/O97IEDuegYdOTZNy1Sp8kFDAgOIUmjJi/Mcdce\nJyihZFUyhsRxaPZc0YQl7yU15d8bDLYhnYI+MLM7sQNEtOklcRUQxLKiPdAvwBVj\nDmDZKDBiaTdBS27E5yXSI2EnIrVvG9CFDRivoSqEkJlV9++cyRlp5w37+/YEfLTk\ns+LSLphCsJDnYqOJ2AN/dxjKST6THCzNf1Jqyj7SsW9TAtNDQtUq11ig1WpO/wBD\nt66JIyQYUY2fbqGOcOzpBoz7RYHM08hKwqdhWy+nqQKBgQDyYakCUSQyweo4IFv/\nnPDoxBafd5OA18IJMYZCk3OfeLOjcABfa+AwGTskSbz3Z7Mugp1n6PPNBuzSwaY6\nDJ8JzcWx4yNWTINubOrL2PHNYn48aWcor67KlBRnIMrnuwomHhQI/i/zkw0FYwtK\ndm5m9p1RkreVxB5hFD9DJVGDRwKBgQDljwp5178S6Cbym6Q23TfrgujmxvU44T3R\nIBKRG+rWrK0eKO5jy2aADg+j3umRoo0rScV4lVvJOaYV6Z361fU2lsQl8nTUB50+\nA+L53ZhGjud72RvZOWSxCinJGS6HuEXkMZWjJnppqdrJsYyxqnmt0ML3knYKFe2P\nJjmHzU6RKQKBgFbeKXRrIE4QsaDr+AzkcnL51CHS+Up0CVbCKRwzPH0rBTbOLVQF\nlZOnd0rKIq+Iuu8wYLmdA8O3d6kRPkIPw+//j5rxjPig83ngD0Z/uimh4xxDqnUq\ngbqY17ceSZpDrp96qDOQ5h6l1UTY+nL1fxvnxvo1WxaR81FXsFSgS1aBAoGAeQJN\nQGtVYu8T0OHwz6cPmkt44GZS0DgT8RBaGTpBMgb2fyaOe/a1wp0m63hPYaDxj7ck\nrGr3ZnzIK1bqG1b8G1mgbmx/32FgJ1e/J34DjnY4WlXZU0no5VZ5LnPizlJ6LU9i\nFQ3si5SpK5c3llRKLjEVBZKkPK7QepxoyUiVuPkCgYAIcV6Z7m77IbKcEYoDa5tl\nJ36kG6wFlWeiMmptszhExyFMvixqTJs8nERjsQynuJwvRwAmCgXIeLEPyYD2OFOG\nWva7Ntd/7fMIPiSSSb2t3sI0MWwTRSKYRocbfpHSRv81rxQE/I2DacF+lYigzSgr\n7367TDNIvf3DrL8xbvCHig==\n-----END PRIVATE KEY-----\n",
  };
}

function resolveDatabaseURL(): string {
  return (
    process.env.FIREBASE_DATABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL?.trim() ||
    "https://last-197cd-default-rtdb.firebaseio.com"
  );
}

// Initialize Firebase Admin
let adminDb: database.Database | null = null;
let adminAuth: auth.Auth | null = null;

if (admin && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(loadServiceAccount()),
      databaseURL: resolveDatabaseURL(),
    });
    console.log("🔥 Firebase Admin SDK initialized successfully");
    adminDb = admin.database();
    adminAuth = admin.auth();
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
  }
} else if (admin && admin.apps.length > 0) {
  adminDb = admin.database();
  adminAuth = admin.auth();
}

export { adminDb, adminAuth };
export default admin;