// services/familyEngine.js

/**
 * AUTO SPLIT
 * Example:
 * ₹800 / 4 Students = ₹200 each
 */
function calculateAutoSplit(monthlyFee, totalMembers) {
  
  if (!totalMembers || totalMembers <= 0) {
    return 0;
  }
  
  return Math.round(monthlyFee / totalMembers);
}


/**
 * MANUAL SPLIT
 * Returns custom fee of each member
 */
function calculateManualSplit(member) {
  
  return member.customFee || 0;
  
}


/**
 * Returns only active members
 */
function getActiveMembers(family) {
  
  return family.members.filter(m => m.active);
  
}


module.exports = {
  
  calculateAutoSplit,
  
  calculateManualSplit,
  
  getActiveMembers
  
};