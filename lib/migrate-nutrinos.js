// Utility script to migrate existing Nutrinos data to include user names
// This should be run once to update existing data

import { db } from "./firebase";
import { ref, get, update } from "firebase/database";
import { createStudentMapping } from "./students-loader";

/**
 * Migrate existing Nutrinos data to include user names from students.json
 */
export const migrateNutrinosData = async () => {
  try {
    console.log("Starting Nutrinos data migration...");
    
    // Get all current Nutrinos data
    const nutrinosRef = ref(db, 'userNutrinos');
    const nutrinosSnapshot = await get(nutrinosRef);
    const nutrinosData = nutrinosSnapshot.val() || {};
    
    // Create student mapping from JSON data
    const studentMapping = createStudentMapping();
    
    let updatedCount = 0;
    
    // Update each user's Nutrinos record with their proper name
    for (const [roll, userData] of Object.entries(nutrinosData)) {
      if (!userData.name || userData.name === `User ${roll}` || userData.name === `Student ${roll}`) {
        // Get the proper name from students mapping
        const properName = studentMapping[roll];
        if (properName) {
          await update(ref(db, `userNutrinos/${roll}`), {
            name: properName
          });
          updatedCount++;
          console.log(`Updated ${roll}: ${properName}`);
        }
      }
    }
    
    console.log(`Migration completed! Updated ${updatedCount} records.`);
    return { success: true, updatedCount };
    
  } catch (error) {
    console.error("Error during migration:", error);
    return { success: false, error: error.message };
  }
};

export default migrateNutrinosData;
