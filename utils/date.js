function getFormattedTodayDate() {
  const d = new Date();
  
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDate(date) {
  if (!date) return '';
  
  const d = new Date(date);
  
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function isValidDate(date) {
  return !isNaN(new Date(date).getTime());
}

module.exports = {
  getFormattedTodayDate,
  formatDate,
  isValidDate
};