import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

const apps = getApps();

export const initFirebaseApp = (config, name = "[DEFAULT]") => {
  if (!apps.find((app) => app.name === name)) {
    return initializeApp(config, name);
  }
  return getApp(name);
};

export const getFirebaseDatabase = (appName = "[DEFAULT]") => {
  const app = getApp(appName);
  return getDatabase(app);
};