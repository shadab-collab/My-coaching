const { MONTHS, getMonthIndex } = require('./months');

function isMonthBeforeJoin(month, year, joinDate) {
  if (!joinDate) return false;
  
  const jd = new Date(joinDate);
  
  if (isNaN(jd.getTime())) return false;
  
  const joinYear = jd.getFullYear();
  const joinMonth = jd.getMonth();
  
  if (year < joinYear) return true;
  
  if (year > joinYear) return false;
  
  return getMonthIndex(month) < joinMonth;
}

function findFeeRecord(student, month, year) {
  if (!student.fees) return null;
  
  return student.fees.find(f =>
    f.month === month &&
    f.year === year
  );
}

function calculateDue(student, month, year) {
  if (isMonthBeforeJoin(month, year, student.joinDate))
    return false;
  
  const fee = findFeeRecord(student, month, year);
  
  if (!fee) return true;
  
  return fee.status === 'unpaid' || fee.status === 'partial';
}

module.exports = {
  isMonthBeforeJoin,
  findFeeRecord,
  calculateDue
};