const MONTHS = [
  'JN',
  'FB',
  'MR',
  'AP',
  'MY',
  'JU',
  'JL',
  'AG',
  'SP',
  'OC',
  'NV',
  'DC'
];

function getCurrentMonth() {
  return MONTHS[new Date().getMonth()];
}

function getCurrentYear() {
  return new Date().getFullYear();
}

function getMonthIndex(month) {
  return MONTHS.indexOf(month);
}

function getPreviousMonths(count = 6) {
  const list = [];
  const now = new Date();
  
  for (let i = count; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    
    list.push({
      month: MONTHS[d.getMonth()],
      year: d.getFullYear()
    });
  }
  
  return list;
}

module.exports = {
  MONTHS,
  getCurrentMonth,
  getCurrentYear,
  getMonthIndex,
  getPreviousMonths
};