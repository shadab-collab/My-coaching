// services/FamilyEngine.js

/**
 * AUTO SPLIT
 * Example:
 * ₹800 / 4 = ₹200
 */
function calculateAutoSplit(totalFee, members) {
  
  if (!members || members.length === 0) return [];
  
  const share = Math.round(totalFee / members.length);
  
  return members.map(member => ({
    studentId: member._id,
    amount: share
  }));
  
}


/**
 * MANUAL SPLIT
 */
function calculateManualSplit(members) {
  
  return members.map(member => ({
    studentId: member._id,
    amount: member.monthlyFee || 0
  }));
  
}


/**
 * Get Active Members
 */
function getActiveMembers(members) {
  
  return members.filter(m => m.active === true);
  
}


/**
 * Total Family Fee
 */
function getFamilyTotal(members) {
  
  return members.reduce((sum, m) => {
    
    return sum + (m.monthlyFee || 0);
    
  }, 0);
  
}


/**
 * Find Head Member
 * (पहला Active Member)
 */
function getFamilyHead(members) {
  
  return members.find(m => m.active) || null;
  
}


/**
 * Member Count
 */
function getMemberCount(members) {
  
  return getActiveMembers(members).length;
  
}

module.exports = {
  
  calculateAutoSplit,
  
  calculateManualSplit,
  
  getActiveMembers,
  
  getFamilyTotal,
  
  getFamilyHead,
  
  getMemberCount
  
};