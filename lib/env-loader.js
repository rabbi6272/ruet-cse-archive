// Environment variable loader with fallback
const loadEnvVariables = () => {
  // Try to load from process.env first
  const envVars = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  // Log what we found (for debugging)
  // console.log('Environment variables loaded:', {
  //   apiKey: envVars.apiKey ? 'Found' : 'Missing',
  //   authDomain: envVars.authDomain ? 'Found' : 'Missing',
  //   databaseURL: envVars.databaseURL ? 'Found' : 'Missing',
  //   projectId: envVars.projectId ? 'Found' : 'Missing',
  //   storageBucket: envVars.storageBucket ? 'Found' : 'Missing',
  //   messagingSenderId: envVars.messagingSenderId ? 'Found' : 'Missing',
  //   appId: envVars.appId ? 'Found' : 'Missing',
  //   measurementId: envVars.measurementId ? 'Found' : 'Missing'
  // });

  return envVars;
};

export default loadEnvVariables;
