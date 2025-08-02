import { users } from './mino';

// Parse roll number to extract batch, dept, and roll
export const parseRoll = (rollNumber) => {
  if (!rollNumber || rollNumber.length !== 7) return null;
  
  const batch = rollNumber.slice(0, 2); // First 2 digits
  const dept = rollNumber.slice(2, 4);  // Next 2 digits
  const roll = parseInt(rollNumber.slice(4)); // Last 3 digits
  
  return { batch, dept, roll, fullRoll: rollNumber };
};

// Determine group (A, B, C) based on roll number
export const determineGroup = (roll) => {
  if (roll >= 1 && roll <= 60) return 'A';
  if (roll >= 61 && roll <= 120) return 'B';
  if (roll >= 121 && roll <= 180) return 'C';
  return null; // Invalid roll
};

// Generate group ID
export const generateGroupId = (batch, dept, group) => {
  return `${batch}-${dept}-${group}`;
};

// Get group name for display
export const getGroupName = (batch, dept, group) => {
  const deptNames = {
    '01': 'Civil',
    '02': 'EEE',
    '03': 'CSE',
    '04': 'Mechanical',
    '05': 'IPE',
    '06': 'Chemical',
    '07': 'Materials',
    '08': 'Environmental',
    '09': 'Architecture',
    '10': 'Urban Planning'
  };
  
  const deptName = deptNames[dept] || `Dept-${dept}`;
  return `Batch ${batch} ${deptName} Group ${group}`;
};

// Create all possible groups from mino.js users
export const createGroupsFromUsers = () => {
  const groups = new Map();
  
  users.forEach(user => {
    const parsed = parseRoll(user.roll);
    if (!parsed) return;
    
    const { batch, dept, roll } = parsed;
    const group = determineGroup(roll);
    if (!group) return;
    
    const groupId = generateGroupId(batch, dept, group);
    const groupName = getGroupName(batch, dept, group);
    
    if (!groups.has(groupId)) {
      groups.set(groupId, {
        id: groupId,
        name: groupName,
        batch,
        dept,
        group,
        participants: [],
        participantNames: {}
      });
    }
    
    const groupData = groups.get(groupId);
    groupData.participants.push(user.roll);
    groupData.participantNames[user.roll] = user.name;
  });
  
  return Array.from(groups.values());
};

// Get user's group
export const getUserGroup = (userRoll) => {
  const parsed = parseRoll(userRoll);
  if (!parsed) return null;
  
  const { batch, dept, roll } = parsed;
  const group = determineGroup(roll);
  if (!group) return null;
  
  const groupId = generateGroupId(batch, dept, group);
  const groupName = getGroupName(batch, dept, group);
  
  // Find all users in this group
  const groupUsers = users.filter(user => {
    const userParsed = parseRoll(user.roll);
    return userParsed && 
           userParsed.batch === batch && 
           userParsed.dept === dept &&
           determineGroup(userParsed.roll) === group;
  });
  
  return {
    id: groupId,
    name: groupName,
    batch,
    dept,
    group,
    participants: groupUsers.map(u => u.roll),
    participantNames: Object.fromEntries(groupUsers.map(u => [u.roll, u.name]))
  };
};

// Check if user belongs to a specific group
export const isUserInGroup = (userRoll, groupId) => {
  const userGroup = getUserGroup(userRoll);
  return userGroup && userGroup.id === groupId;
};
