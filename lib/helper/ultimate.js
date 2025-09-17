//by bitto
//global connects
import { initFirebaseApp, getFirebaseDatabase } from "../helper/firebase_init";
import { getDatabase, ref, set, update, remove, get } from "firebase/database";

//individual configs
const codelib_config = {
  apiKey: "AIzaSyDcvagoN3Uv6PSTuXQg5uztf2tdiXl--dc",
  authDomain: "cse-archive-codes.firebaseapp.com",
  databaseURL: "https://cse-archive-codes-default-rtdb.firebaseio.com",
  projectId: "cse-archive-codes",
  storageBucket: "cse-archive-codes.firebasestorage.app",
  messagingSenderId: "15084195695",
  appId: "1:15084195695:web:21fad2e1a180645a79e29a",
  measurementId: "G-GMXJ26J8ET",
};
const gc_config = {
  apiKey: "AIzaSyDw71q3_mHKAhl-FuIfrmCBBBe_ofkwx_U",
  authDomain: "ruetcsemembers.firebaseapp.com",
  databaseURL: "https://ruetcsemembers-default-rtdb.firebaseio.com",
  projectId: "ruetcsemembers",
  storageBucket: "ruetcsemembers.firebasestorage.app",
  messagingSenderId: "856957640435",
  appId: "1:856957640435:web:417ec5cfb7b5806f9c6186",
  measurementId: "G-8DYPZ2KVE5",
};
const custom_config = {
  apiKey: "AIzaSyBEcJwDXBKPW6v6fwSdowgbOXbICHpI_w4",
  authDomain: "cse-archive-utilities.firebaseapp.com",
  databaseURL:
    "https://cse-archive-utilities-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "cse-archive-utilities",
  storageBucket: "cse-archive-utilities.firebasestorage.app",
  messagingSenderId: "904534032932",
  appId: "1:904534032932:web:f23fbcd2664e8311930eb1",
  measurementId: "G-TVCT2J8SVQ",
};
const pc_config = {
  apiKey: "AIzaSyDZs0pHhWDJ-v1-lUq9HW3Og5JmZddvP4o",
  authDomain: "cse-archive-p2p.firebaseapp.com",
  databaseURL:
    "https://cse-archive-p2p-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cse-archive-p2p",
  storageBucket: "cse-archive-p2p.firebasestorage.app",
  messagingSenderId: "461854223708",
  appId: "1:461854223708:web:abcd53dbacbb66ed872599",
  measurementId: "G-41WPKX61LH",
};
const ac_config = {
  apiKey: "AIzaSyDhexCMs4s-OGmUTaY7lVWSCChm04WlD0s",
  authDomain: "cse-archive-pikachu.firebaseapp.com",
  databaseURL:
    "https://cse-archive-pikachu-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "cse-archive-pikachu",
  storageBucket: "cse-archive-pikachu.firebasestorage.app",
  messagingSenderId: "202630937509",
  appId: "1:202630937509:web:0480ac0f7259f93af5c64c",
  measurementId: "G-PL76MS9K2R",
};
const doubts_config = {
  apiKey: "AIzaSyADyijgmsTZycqxgU3tnFqt8tCS1u5Rue4",
  authDomain: "cse-archive-doubts.firebaseapp.com",
  databaseURL:
    "https://cse-archive-doubts-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "cse-archive-doubts",
  storageBucket: "cse-archive-doubts.firebasestorage.app",
  messagingSenderId: "703675496905",
  appId: "1:703675496905:web:46caeb764e5b2befacd018",
  measurementId: "G-F9TQKBEHGH",
};

//helper functions of the instances to work properly
function sort(a, b) {
  return Number(a) < Number(b) ? `${a}_${b}` : `${b}_${a}`;
}
function detectThreadName(roll) {
  var abc = roll.toString().split(" ");
  var th = abc[0] + abc[1] + abc[2] + abc[3];
  var last = abc[4] + abc[5] + abc[6];
  var rl = Number(last);
  if (rl <= 60) {
    th += "A";
  } else if (rl > 60 && rl <= 120) {
    th += "B";
  } else {
    th += "C";
  }

  return th;
}

//database helper functions
class AssistantMessage {
  constructor(obj = {}) {
    this.obj = obj;
    this.app = initFirebaseApp(ac_config, "ASSISTANT_APP");
    this.db = getFirebaseDatabase("ASSISTANT_APP");
    this.threadName = sort(this.obj.sender, this.obj.reciever);
  }

  async push() {
    try {
      const dbRef = ref(this.db, `${this.threadName}/${this.obj.sender}`);
      await set(dbRef, this.obj);
      console.log(`Data inserted successfully.`);
    } catch (error) {
      console.error("Error inserting data:", error);
    }
  }
  async read(roll) {
    try {
      const dbRef = ref(this.db, `${this.threadName}/${this.obj.sender}`);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  }

  async update(roll, updates) {
    try {
      const dbRef = ref(this.db, `${this.threadName}/${this.obj.sender}`);
      await update(dbRef, updates);
    } catch (error) {
      throw error;
    }
  }

  async remove(roll) {
    try {
      const dbRef = ref(this.db, `${this.threadName}/${this.obj.sender}`);
      await remove(dbRef);
    } catch (error) {
      throw error;
    }
  }
}
class CodeSnippet {
  constructor(obj = {}) {
    this.obj = obj;
    this.app = initFirebaseApp(codelib_config, "CODE_LIBRARY_APP");
    this.db = getFirebaseDatabase("CODE_LIBRARY_APP");
  }

  async push(roll) {
    try {
      const dbRef = ref(this.db, "codes/" + roll);
      await set(dbRef, this.obj);
      console.log(`Data inserted successfully.`);
    } catch (error) {
      console.error("Error inserting data:", error);
    }
  }
  async read(roll) {
    try {
      const dbRef = ref(this.db, "codes/" + roll);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  }

  async update(roll, updates) {
    try {
      const dbRef = ref(this.db, "codes/" + roll);
      await update(dbRef, updates);
    } catch (error) {
      throw error;
    }
  }

  async remove(roll) {
    try {
      const dbRef = ref(this.db, "codes/" + roll);
      await remove(dbRef);
    } catch (error) {
      throw error;
    }
  }
}
class CustomBuilder {
  constructor(obj = {}, parentName = "") {
    this.obj = obj;
    this.app = initFirebaseApp(custom_config, "CUSTOM_APP");
    this.db = getFirebaseDatabase("CUSTOM_APP");
    this.parent = parentName;
  }

  async push() {
    try {
      const dbRef = ref(this.db, `${this.parent}/${this.obj.roll}`);
      await set(dbRef, this.obj);
      console.log(`Data inserted successfully.`);
    } catch (error) {
      console.error("Error inserting data:", error);
    }
  }
  async read(roll) {
    try {
      const dbRef = ref(this.db, `${this.parent}/${this.obj.roll}`);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  }

  async update(roll, updates) {
    try {
      const dbRef = ref(this.db, `${this.parent}/${this.obj.roll}`);
      await update(dbRef, updates);
    } catch (error) {
      throw error;
    }
  }

  async remove(roll) {
    try {
      const dbRef = ref(this.db, `${this.parent}/${this.obj.roll}`);
      await remove(dbRef);
    } catch (error) {
      throw error;
    }
  }
}
class DoubtsHelp {
  constructor(obj = {}, threadname = "") {
    this.obj = obj;
    this.app = initFirebaseApp(doubts_config, "DOUBTS_APP");
    this.db = getFirebaseDatabase("DOUBTS_APP");
    this.threadName = threadname;
  }

  async push() {
    try {
      const dbRef = ref(this.db, this.obj.roll + "/" + this.threadName);
      await set(dbRef, this.obj);
      console.log(`Data inserted successfully.`);
    } catch (error) {
      console.error("Error inserting data:", error);
    }
  }
  async read(roll) {
    try {
      const dbRef = ref(this.db, this.obj.roll + "/" + this.threadName);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  }

  async update(roll, updates) {
    try {
      const dbRef = ref(this.db, this.obj.roll + "/" + this.threadName);
      await update(dbRef, updates);
    } catch (error) {
      throw error;
    }
  }

  async remove(roll) {
    try {
      const dbRef = ref(this.db, this.obj.roll + "/" + this.threadName);
      await remove(dbRef);
    } catch (error) {
      throw error;
    }
  }
}
class GroupMessage {
  constructor(obj = {}) {
    this.obj = obj;
    this.app = initFirebaseApp(gc_config, "GROUP_CHAT_APP");
    this.db = getFirebaseDatabase("GROUP_CHAT_APP");
    this.thread = detectThreadName(this.obj.roll);
  }

  async push() {
    try {
      const dbRef = ref(this.db, `${this.thread}/${this.obj.roll}`);
      await set(dbRef, this.obj);
      console.log(`Data inserted successfully.`);
    } catch (error) {
      console.error("Error inserting data:", error);
    }
  }
  async read(roll) {
    try {
      const dbRef = ref(this.db, `${this.thread}/${this.obj.roll}`);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  }

  async update(roll, updates) {
    try {
      const dbRef = ref(this.db, `${this.thread}/${this.obj.roll}`);
      await update(dbRef, updates);
    } catch (error) {
      throw error;
    }
  }

  async remove(roll) {
    try {
      const dbRef = ref(this.db, `${this.thread}/${this.obj.roll}`);
      await remove(dbRef);
    } catch (error) {
      throw error;
    }
  }
}
class PersonalMessage {
  constructor(obj = {}) {
    this.obj = obj;
    this.app = initFirebaseApp(pc_config, "PERSONAL_CHAT_APP");
    this.db = getFirebaseDatabase("PERSONAL_CHAT_APP");
    this.threadName = sort(this.obj.sender, this.obj.reciever);
  }

  async push() {
    try {
      const dbRef = ref(this.db, `${this.threadName}/${this.obj.sender}`);
      await set(dbRef, this.obj);
      console.log(`Data inserted successfully.`);
    } catch (error) {
      console.error("Error inserting data:", error);
    }
  }
  async read(roll) {
    try {
      const dbRef = ref(this.db, `${this.threadName}/${this.obj.sender}`);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  }

  async update(roll, updates) {
    try {
      const dbRef = ref(this.db, `${this.threadName}/${this.obj.sender}`);
      await update(dbRef, updates);
    } catch (error) {
      throw error;
    }
  }

  async remove(roll) {
    try {
      const dbRef = ref(this.db, `${this.threadName}/${this.obj.sender}`);
      await remove(dbRef);
    } catch (error) {
      throw error;
    }
  }
}
class Notification {
  constructor(obj = {}) {
    this.obj = obj;
    this.app = initFirebaseApp(custom_config, "CUSTOM_APP");
    this.db = getFirebaseDatabase("CUSTOM_APP");
    this.parent = "notifications";
  }

  async push() {
    try {
      const dbRef = ref(this.db, `${this.parent}/${this.obj.roll}`);
      await set(dbRef, this.obj);
      console.log(`Data inserted successfully.`);
    } catch (error) {
      console.error("Error inserting data:", error);
    }
  }
  async read(roll) {
    try {
      const dbRef = ref(this.db, `${this.parent}/${this.obj.roll}`);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  }

  async update(roll, updates) {
    try {
      const dbRef = ref(this.db, `${this.parent}/${this.obj.roll}`);
      await update(dbRef, updates);
    } catch (error) {
      throw error;
    }
  }

  async remove(roll) {
    try {
      const dbRef = ref(this.db, `${this.parent}/${this.obj.roll}`);
      await remove(dbRef);
    } catch (error) {
      throw error;
    }
  }
}
class Presence {
  constructor(obj = {}) {
    this.obj = obj;
    this.app = initFirebaseApp(custom_config, "CUSTOM_APP");
    this.db = getFirebaseDatabase("CUSTOM_APP");
    this.parent = "presence";
  }

  async push() {
    try {
      const dbRef = ref(this.db, `${this.parent}/${this.obj.roll}`);
      await set(dbRef, this.obj);
      console.log(`Data inserted successfully.`);
    } catch (error) {
      console.error("Error inserting data:", error);
    }
  }
  async read(roll) {
    try {
      const dbRef = ref(this.db, `${this.parent}/${this.obj.roll}`);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  }

  async update(roll, updates) {
    try {
      const dbRef = ref(this.db, `${this.parent}/${this.obj.roll}`);
      await update(dbRef, updates);
    } catch (error) {
      throw error;
    }
  }

  async remove(roll) {
    try {
      const dbRef = ref(this.db, `${this.parent}/${this.obj.roll}`);
      await remove(dbRef);
    } catch (error) {
      throw error;
    }
  }
}
class NutrinoManager {
  constructor(obj = {}) {
    this.obj = obj;
    this.app = initFirebaseApp(custom_config, "CUSTOM_APP");
    this.db = getFirebaseDatabase("CUSTOM_APP");
    this.parent = "nutrinos";
  }

  async push() {
    try {
      const dbRef = ref(this.db, `${this.parent}/${this.obj.roll}`);
      await set(dbRef, this.obj);
      console.log(`Data inserted successfully.`);
    } catch (error) {
      console.error("Error inserting data:", error);
    }
  }
  async read(roll) {
    try {
      const dbRef = ref(this.db, `${this.parent}/${this.obj.roll}`);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  }

  async update(roll, updates) {
    try {
      const dbRef = ref(this.db, `${this.parent}/${this.obj.roll}`);
      await update(dbRef, updates);
    } catch (error) {
      throw error;
    }
  }

  async remove(roll) {
    try {
      const dbRef = ref(this.db, `${this.parent}/${this.obj.roll}`);
      await remove(dbRef);
    } catch (error) {
      throw error;
    }
  }
}

export {
  AssistantMessage,
  CodeSnippet,
  CustomBuilder,
  GroupMessage,
  PersonalMessage,
  DoubtsHelp,
  Notification,
  Presence,
  NutrinoManager,
};
