import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

export const initFirebaseApp = (config, name = "[DEFAULT]") => {
  if (!getApps().find((app) => app.name === name)) {
    return initializeApp(config, name);
  }
  return getApp(name);
};

export const getFirebaseDatabase = (appName = "[DEFAULT]") => {
  const app = getApp(appName);
  return getDatabase(app);
};
