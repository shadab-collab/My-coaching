const API = '/api/students';
const MONTHS = ['JN','FB','MR','AP','MY','JU','JL','AG','SP','OC','NV','DC'];
const CUR_YEAR = new Date().getFullYear();
const CUR_MONTH_IDX = new Date().getMonth();
const CUR_MONTH = MONTHS[CUR_MONTH_IDX];

let students = [];
let currentStudent = null;
let currentMonth = null;
let currentYear = null;
let isFamilyMark = false;

// क्लीन शुरुआत के लिए मंथ फिल्टर
function isMonthBeforeJoin(monthName, year, joinDateStr) {
  const monthIdx = MONTHS.indexOf(monthName);
  let startYear = 2026, startMonthIdx = 6; // default July 2026
  if (joinDateStr) {
    const jd = new Date(joinDateStr);
    if (!isNaN(jd.getTime())) { startYear = jd.getFullYear(); startMonthIdx = jd.getMonth(); }
  }
  if (year < startYear) return true;
  if (year > startYear) return false;
  return monthIdx < startMonthIdx;
}

function showCustomAlert(msg) {
  document.getElementById('customAlertMessage').innerText = msg;
  document.getElementById('customAlertModal').classList.add('open');
}

function showCustomConfirm(msg, onConfirmCallback) {
  document.getElementById('customConfirmMessage').innerText = msg;
  const yesBtn = document.getElementById('customConfirmYesBtn');
  const newYesBtn = yesBtn.cloneNode(true);
  yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
  newYesBtn.addEventListener('click', () => { closeModal('customConfirmModal'); onConfirmCallback(); });
  document.getElementById('customConfirmModal').classList.add('open');
}

function getVisibleMonths() {
  const visible = [];
  for (let i = -6; i <= 1; i++) {
    let idx = CUR_MONTH_IDX + i;
    let year = CUR_YEAR;
    if (idx < 0) { idx += 12; year -= 1; }
    if (idx > 11) { idx -= 12; year += 1; }
    visible.push({ month: MONTHS[idx], year });
  }
  return visible;
}

async function loadStudents() {
  try {
    const res = await fetch(API);
    students = await res.json();
    calculateDashboardStats(students);
    renderStudents(students);
  } catch (err) {
    console.error(err);
  }
}

function calculateDashboardStats(list) {
  let todayCollection = 0, monthCollection = 0, dueCount = 0;
  const todayStr = getFormattedTodayDate();

  list.forEach(student => {
    if (hasDue(student)) dueCount++;
    student.fees?.forEach(fee => {
      if (fee.paidOn === todayStr && ['paid', 'partial', 'advance'].includes(fee.status)) todayCollection += (fee.paidAmount || 0);
      if (fee.month === CUR_MONTH && fee.year === CUR_YEAR && ['paid', 'partial', 'advance'].includes(fee.status)) monthCollection += (fee.paidAmount || 0);
    });
  });

  document.getElementById('statTodayCollection').innerText = `₹${todayCollection}`;
  document.getElementById('statMonthCollection').innerText = `₹${monthCollection}`;
  document.getElementById('statTotalDues').innerText = `${dueCount} छात्र`;
}

function getFormattedTodayDate() {
  const d = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// मुख्य रेंडरिंग इंजन
function renderStudents(list) {
  const container = document.getElementById('studentList');
  if (list.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:2rem;color:#666;">कोई रिकॉर्ड नहीं मिला</p>';
    return;
  }

  const groups = {}, solo = [];
  list.forEach(s => { 
    if (s.familyCode) { 
      if (!groups[s.familyCode]) groups[s.familyCode] = []; 
      groups[s.familyCode].push(s); 
    } else { 
      solo.push(s); 
    } 
  });

  Object.keys(groups).forEach(code => groups[code].sort((a, b) => a.name.localeCompare(b.name)));
  solo.sort((a, b) => a.name.localeCompare(b.name));

  let html = '';

  // 1. फ़ैमिली कार्ड्स रेंडरिंग
  Object.keys(groups).sort().forEach(code => {
    const members = groups[code];
    const isDue = members.some(s => hasDue(s));
    const headerClass = members.some(s => s.verify) ? 'verify' : isDue ? 'due' : '';
    
    // वर्तमान फैमली कॉन्फ़िगरेशन
    const isFixedFamilyFee = members.some(s => s.isFamilyFee);
    const splitType = members[0].splitType || 'auto';
    const totalFamilyFee = members.reduce((sum, m) => sum + (m.monthlyFee || 0), 0);

    const namesOnly = members.map(m => m.name).join(' • ');
    const displayType = splitType === 'auto' ? "Total Package Deal" : "Custom Split Deal";

    const reminderText = `अभिभावक कृपया ध्यान देंगे: SHADAB COACHING CENTER की ओर से सूचित किया जाता है कि छात्र ${namesOnly} की ${CUR_MONTH} ${CUR_YEAR} की फीस बाकी है। कृपया भुगतान करें।`;

    html += `
    <div class="student-card">
      <div class="student-header ${headerClass}" onclick="toggleFees('grp-${code}')">
        <div>
          <div class="student-name"><span class="family-tag">${code}</span> ${namesOnly}</div>
          <div class="student-meta">Due: ${members[0].dueDate} तारीख • Type: <strong>${displayType}</strong> • ₹${totalFamilyFee || 'Fixed Deal'}/month</div>
        </div>
        <div class="student-badges">
          ${isDue ? '<span class="badge badge-red">Due</span>' : '<span class="badge badge-green">Clear</span>'}
          <button onclick="event.stopPropagation();openHisabModalForFamily('${code}')" class="btn-action green" style="background:#1a7a4a;color:white;border:none;border-radius:4px;font-size:0.75rem;font-weight:700;cursor:pointer;padding:0.3rem 0.6rem;margin-right:0.3rem;min-height:32px">📖 हिसाब</button>
          ${isDue ? `<a href="https://wa.me/?text=${encodeURIComponent(reminderText)}" onclick="event.stopPropagation();" target="_blank" style="background:#25d366; color:white; border-radius:4px; font-size:0.75rem; font-weight:700; padding:0.35rem 0.6rem; margin-right:0.3rem; text-decoration:none; display:inline-block; text-align:center;">💬 Remind</a>` : ''}
          <button onclick="event.stopPropagation();showFamilyOptions('${code}')" class="btn-action red" style="background:#dc3545;color:white;border:none;border-radius:4px;font-size:0.75rem;font-weight:700;cursor:pointer;padding:0.3rem 0.6rem;min-width:40px;min-height:32px">Del</button>
          <span>▾</span>
        </div>
      </div>
      <div class="fees-row" id="fees-grp-${code}" style="display:none">
        <button onclick="toggleArchive('arch-${code}')" style="background:#e8f0fe;border:1px solid #aac;border-radius:4px;padding:0.2rem 0.6rem;font-size:0.7rem;cursor:pointer">📁 पुराना</button>
        <div id="arch-${code}" style="display:none;width:100%;flex-wrap:wrap;gap:0.3rem;margin-bottom:0.3rem">
          ${renderArchiveBtns(members[0], code, true)}
        </div>
        ${renderMonthBtns(members[0], code, true)}
        <div style="width:100%;margin-top:0.5rem;font-size:0.75rem;color:#666;display:flex;flex-wrap:wrap;gap:0.5rem">
          ${members.map(m => `
            <span>
              ${m.name}:
              <button onclick="openMarkModal('${m._id}',null,null,false)" style="background:none;border:1px solid #ddd;border-radius:4px;padding:0.2rem 0.5rem;font-size:0.7rem;cursor:pointer">अलग mark</button>
              <button onclick="openHisabModal('${m._id}')" style="background:none;border:1px solid #1a7a4a;color:#1a7a4a;border-radius:4px;padding:0.2rem 0.5rem;font-size:0.7rem;cursor:pointer">हिसाब</button>
              <button onclick="deleteStudent('${m._id}','${m.name}')" style="background:none;border:1px solid #dc3545;color:#dc3545;border-radius:4px;padding:0.2rem 0.5rem;font-size:0.7rem;cursor:pointer">हटाएं</button>
            </span>`).join('')}
        </div>
      </div>
    </div>`;
  });

  // 2. सिंगल स्टूडेंट्स
  solo.forEach(student => {
    const isDue = hasDue(student);
    const headerClass = student.verify ? 'verify' : isDue ? 'due' : '';
    const nameDisplay = `${student.name}${student.identity ? ' (' + student.identity + ')' : ''}`;
    const studentFeeType = student.isFamilyFee ? "Family Fee" : "Individual Fee";

    const reminderText = `अभिभावक कृपया ध्यान देंगे: SHADAB COACHING CENTER की ओर से सूचित किया जाता है कि छात्र ${student.name} की ${CUR_MONTH} ${CUR_YEAR} महीने की फीस बाकी है। कृपया भुगतान करें।`;

    html += `
    <div class="student-card">
      <div class="student-header ${headerClass}" onclick="toggleFees('${student._id}')">
        <div>
          <div class="student-name">${nameDisplay}
            ${student.verify ? ' <span style="color:#fd7e14">⚠️</span>' : ''}
          </div>
          <div class="student-meta">
            Due: ${student.dueDate} तारीख • 
            Type: <strong>${studentFeeType}</strong> •
            ${student.batch ? 'Batch ' + student.batch + ' • ' : ''}
            ₹${student.monthlyFee || 0}/month
          </div>
        </div>
        <div class="student-badges">
          ${isDue ? '<span class="badge badge-red">Due</span>' : '<span class="badge badge-green">Clear</span>'}
          <button onclick="event.stopPropagation();openHisabModal('${student._id}')" style="background:#1a7a4a;color:white;border:none;border-radius:4px;font-size:0.75rem;font-weight:700;cursor:pointer;padding:0.3rem 0.6rem;margin-right:0.3rem;min-height:32px">📖 हिसाब</button>
          ${isDue ? `<a href="https://wa.me/?text=${encodeURIComponent(reminderText)}" onclick="event.stopPropagation();" target="_blank" style="background:#25d366; color:white; border-radius:4px; font-size:0.75rem; font-weight:700; padding:0.35rem 0.6rem; margin-right:0.3rem; text-decoration:none; display:inline-block; text-align:center;">💬 Remind</a>` : ''}
          <button onclick="event.stopPropagation();deleteStudent('${student._id}','${student.name}')" style="background:#dc3545;color:white;border:none;border-radius:4px;font-size:0.75rem;font-weight:700;cursor:pointer;padding:0.3rem 0.6rem;min-width:40px;min-height:32px">Del</button>
          <span>▾</span>
        </div>
      </div>
      <div class="fees-row" id="fees-${student._id}" style="display:none">
        <button onclick="toggleArchive('arch-${student._id}')" style="background:#e8f0fe;border:1px solid #aac;border-radius:4px;padding:0.2rem 0.6rem;font-size:0.7rem;cursor:pointer">📁 पुराना</button>
        <div id="arch-${student._id}" style="display:none;width:100%;flex-wrap:wrap;gap:0.3rem;margin-bottom:0.3rem">
          ${renderArchiveBtns(student, student._id, false)}
        </div>
        ${renderMonthBtns(student, student._id, false)}
      </div>
    </div>`;
  });

  container.innerHTML = html;
}

function renderMonthBtns(student, id, isFamily) {
  const visible = getVisibleMonths();
  return visible.map(({ month, year }) => {
    if (isMonthBeforeJoin(month, year, student.joinDate)) { return ''; }
    const fee = student.fees?.find(f => f.month === month && f.year === year);
    const status = fee ? fee.status : 'unpaid';
    const cls = `month-${status}`;
    const note = fee?.note ? ` (${fee.note})` : '';
    const isCurrent = month === CUR_MONTH && year === CUR_YEAR;

    return `<button class="month-btn ${cls}${isCurrent ? ' current-month' : ''}"
      onclick="openMarkModal('${student._id}','${month}',${year},${isFamily},'${id}')">
      ${month}${year !== CUR_YEAR ? "'" + String(year).slice(2) : ''}${note}
    </button>`;
  }).join('');
}

function renderArchiveBtns(student, id, isFamily) {
  const visible = getVisibleMonths();
  const visibleKeys = visible.map(v => v.month + v.year);
  
  const archiveFees = (student.fees || []).filter(f => {
    const isVisible = visibleKeys.includes(f.month + f.year);
    const isBeforeJoin = isMonthBeforeJoin(f.month, f.year, student.joinDate);
    return !isVisible && !isBeforeJoin;
  });

  if (archiveFees.length === 0) {
    return '<span style="font-size:0.75rem;color:#999;padding:0.2rem">कोई पुराना record नहीं</span>';
  }

  return archiveFees.map(f => {
    const cls = `month-${f.status}`;
    const note = f.note ? ` (${f.note})` : '';
    return `<button class="month-btn ${cls}" onclick="openMarkModal('${student._id}','${f.month}',${f.year},${isFamily},'${id}')">
      ${f.month}'${String(f.year).slice(2)}${note}
    </button>`;
  }).join('');
}

function toggleArchive(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'flex' : 'none';
}

function toggleFees(id) {
  const el = document.getElementById(`fees-${id}`);
  if (!el) return;
  const isHidden = el.style.display === 'none';
  el.style.display = isHidden ? 'flex' : 'none';
  if (isHidden) { el.style.flexWrap = 'wrap'; el.style.gap = '0.4rem'; }
}

function hasDue(student) {
  if (isMonthBeforeJoin(CUR_MONTH, CUR_YEAR, student.joinDate)) return false;
  const fee = student.fees?.find(f => f.month === CUR_MONTH && f.year === CUR_YEAR);
  return !fee || fee.status === 'unpaid' || fee.status === 'partial';
}

function filterStudents() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const filter = document.getElementById('filterDue').value;

  let filtered = students.filter(s => {
    const fullName = ((s.identity || '') + ' ' + s.name + ' ' + (s.familyCode || '')).toLowerCase();
    return fullName.includes(search);
  });

  if (filter === 'due') {
    filtered = filtered.filter(s => hasDue(s));
  } else if (filter === '1' || filter === '15') {
    filtered = filtered.filter(s => s.dueDate === parseInt(filter));
  } else if (['1-5','6-8','9','10','CBSE'].includes(filter)) {
    filtered = filtered.filter(s => s.batch === filter);
  }
  renderStudents(filtered);
}

// ----------------- + STUDENT BUTTON CONTROLS -----------------
function openSingleStudentModal() {
  document.getElementById('singleStudentModal').classList.add('open');
}

async function saveSingleStudent() {
  const name = document.getElementById('sName').value.trim();
  const fee = parseInt(document.getElementById('sFee').value) || 0;
  if (!name || fee <= 0) return showCustomAlert('कृपया छात्र का नाम और मंथली फीस सही से दर्ज करें!');

  const data = {
    name,
    identity: document.getElementById('sIdentity').value.trim(),
    monthlyFee: fee,
    batch: document.getElementById('sBatch').value,
    dueDate: parseInt(document.getElementById('sDueDate').value),
    joinDate: document.getElementById('sJoinDate').value,
    isFamilyFee: false
  };

  try {
    const response = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (response.ok) {
      closeModal('singleStudentModal');
      loadStudents();
      ['sName', 'sIdentity', 'sFee'].forEach(id => document.getElementById(id).value = '');
    }
  } catch (err) {
    showCustomAlert('बचाने में त्रुटि: ' + err.message);
  }
}

// ----------------- + FAMILY BUTTON CONTROLS -----------------
let currentFamilyMemberRows = 1;

function openFamilyModal() {
  currentFamilyMemberRows = 1;
  document.getElementById('famMembersContainer').innerHTML = `
    <div class="family-member-input-row" style="display: flex; gap: 0.5rem; width:100%;">
      <input type="text" placeholder="सदस्य 1 का नाम *" class="f-input-name" style="flex: 2;" required>
      <input type="number" placeholder="फीस (₹) *" class="f-input-fee" style="flex: 1; display: none;">
    </div>
  `;
  document.getElementById('fCode').value = '';
  document.getElementById('famIdentity').value = '';
  document.getElementById('fTotalFee').value = '800';
  document.getElementById('famSplitType').value = 'auto';
  toggleFamilyFormSplitFields();
  document.getElementById('familyModal').classList.add('open');
}

function toggleFamilyFormSplitFields() {
  const splitType = document.getElementById('famSplitType').value;
  const isAuto = splitType === 'auto';
  
  // पैकेज फीस इनपुट बॉक्स दिखाएं या छुपाएं
  document.getElementById('famTotalFeeRow').style.display = isAuto ? 'block' : 'none';
  
  // बच्चों की फीस बॉक्स दिखाएं या छुपाएं
  const feeInputs = document.querySelectorAll('.f-input-fee');
  feeInputs.forEach(input => {
    input.style.display = isAuto ? 'none' : 'block';
  });
}

function addMoreMemberField() {
  currentFamilyMemberRows++;
  const splitType = document.getElementById('famSplitType').value;
  const isAuto = splitType === 'auto';

  const div = document.createElement('div');
  div.className = "family-member-input-row";
  div.style.display = "flex";
  div.style.gap = "0.5rem";
  div.style.width = "100%";
  div.innerHTML = `
    <input type="text" placeholder="सदस्य ${currentFamilyMemberRows} का नाम *" class="f-input-name" style="flex: 2;" required>
    <input type="number" placeholder="फीस (₹) *" class="f-input-fee" style="flex: 1; display: ${isAuto ? 'none' : 'block'};">
  `;
  document.getElementById('famMembersContainer').appendChild(div);
}

async function saveFamilyGroup() {
  const familyCode = document.getElementById('fCode').value.trim().toUpperCase();
  if (!familyCode) return showCustomAlert('कृपया फ़ैमिली कोड दर्ज करें!');

  const splitType = document.getElementById('famSplitType').value;
  const identity = document.getElementById('famIdentity').value.trim();
  const batch = document.getElementById('famBatch').value;
  const dueDate = parseInt(document.getElementById('famDueDate').value);
  const joinDate = document.getElementById('famJoinDate').value;

  const nameInputs = document.querySelectorAll('.f-input-name');
  const feeInputs = document.querySelectorAll('.f-input-fee');

  let members = [];
  let calculatedTotal = 0;

  nameInputs.forEach((input, index) => {
    const name = input.value.trim();
    if (name) {
      const pFee = parseInt(feeInputs[index].value) || 0;
      calculatedTotal += pFee;
      members.push({ name, monthlyFee: pFee });
    }
  });

  if (members.length === 0) return showCustomAlert('कम से कम एक सदस्य का नाम अनिवार्य है!');

  const totalFamilyFee = splitType === 'auto' ? (parseInt(document.getElementById('fTotalFee').value) || 0) : calculatedTotal;

  const data = {
    familyCode,
    isFamilyFee: true,
    splitType,
    totalFamilyFee,
    identity,
    batch,
    dueDate,
    joinDate,
    members
  };

  try {
    const response = await fetch('/api/students/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (response.ok) {
      closeModal('familyModal');
      loadStudents();
    }
  } catch (err) {
    showCustomAlert('सुरक्षित करने में त्रुटि: ' + err.message);
  }
}

// =================== फीस मार्क और हिसाब स्क्रीन ===================
function openMarkModal(studentId, month, year, isFamily, familyCode) {
  currentStudent = students.find(s => s._id === studentId);
  currentMonth = month || CUR_MONTH;
  currentYear = parseInt(year) || CUR_YEAR;
  isFamilyMark = isFamily;
  window.currentFamilyCode = familyCode;

  const existing = currentStudent.fees?.find(f => f.month === currentMonth && f.year === currentYear);
  document.getElementById('markInfo').textContent = isFamily ? `${familyCode} परिवार — ${currentMonth} ${currentYear}` : `${currentStudent.name} — ${currentMonth} ${currentYear}`;
  document.getElementById('markStatus').value = existing?.status || 'paid';
  
  if (isFamily && familyCode) {
    const familyMembers = students.filter(s => s.familyCode === familyCode);
    const totalFamilyFee = familyMembers.reduce((sum, m) => sum + (m.monthlyFee || 0), 0);
    
    let existingSum = 0;
    let hasExisting = false;
    familyMembers.forEach(m => {
      const f = m.fees?.find(x => x.month === currentMonth && x.year === currentYear);
      if (f) {
        existingSum += (f.paidAmount || 0);
        hasExisting = true;
      }
    });
    document.getElementById('markAmount').value = hasExisting ? existingSum : (totalFamilyFee || 800);
  } else {
    document.getElementById('markAmount').value = existing?.paidAmount || currentStudent.monthlyFee || '';
  }

  document.getElementById('markNote').value = existing?.note || '';
  document.getElementById('markModal').classList.add('open');
}

function openHisabModal(studentId) {
  const student = students.find(s => s._id === studentId);
  if (!student) return;
  document.getElementById('hisabStudentTitle').innerText = `${student.name} का हिसाब`;
  const badge = document.getElementById('hisabFeeTypeBadge');
  badge.innerText = student.isFamilyFee ? "Family Fee" : "Individual Fee";
  badge.className = student.isFamilyFee ? "badge badge-green" : "badge badge-blue";
  renderDiaryTable(student);
  document.getElementById('hisabModal').classList.add('open');
}

function openHisabModalForFamily(familyCode) {
  const members = students.filter(s => s.familyCode === familyCode);
  if (members.length === 0) return;
  const parentStudent = members[0];
  const names = members.map(m => m.name).join(' • ');

  document.getElementById('hisabStudentTitle').innerText = `${familyCode} परिवार हिसाब (${names})`;
  const badge = document.getElementById('hisabFeeTypeBadge');
  badge.innerText = parentStudent.isFamilyFee ? "Family Deal" : "Combined Fee";
  badge.className = parentStudent.isFamilyFee ? "badge badge-green" : "badge badge-blue";
  renderDiaryTable(parentStudent, true, familyCode);
  document.getElementById('hisabModal').classList.add('open');
}

function renderDiaryTable(student, isFamily = false, familyCode = '') {
  const tbody = document.getElementById('hisabTableBody');
  tbody.innerHTML = '';
  const visible = getVisibleMonths();
  
  let rowsAdded = 0;
  visible.forEach(({ month, year }) => {
    if (isMonthBeforeJoin(month, year, student.joinDate)) return;
    rowsAdded++;
    const fee = student.fees?.find(f => f.month === month && f.year === year);
    const status = fee ? fee.status : 'unpaid';
    const paidOn = fee ? fee.paidOn : 'बाकी';
    
    let displayAmount = student.monthlyFee || 0;
    if (isFamily && familyCode) {
      const familyMembers = students.filter(s => s.familyCode === familyCode);
      const totalFamilyExpected = familyMembers.reduce((sum, m) => sum + (m.monthlyFee || 0), 0);
      let familySum = 0;
      let hasRecord = false;
      familyMembers.forEach(m => {
        const f = m.fees?.find(x => x.month === month && x.year === year);
        if (f) { familySum += (f.paidAmount || 0); hasRecord = true; }
      });
      displayAmount = hasRecord ? familySum : totalFamilyExpected;
    } else if (fee) {
      displayAmount = fee.paidAmount;
    }

    let statusHtml = '';
    if (status === 'paid') {
      statusHtml = `<span style="color:#1a7a4a; font-weight:bold; margin-right:0.4rem;">✅ Paid (₹${displayAmount})</span>
                    <button class="btn-rec-small" onclick="generateInvoice('${student._id}', '${month}', ${year}, ${isFamily}, '${familyCode}')">🧾 रसीद</button>`;
    } else if (status === 'partial') {
      statusHtml = `<span style="color:#e6a817; font-weight:bold; margin-right:0.4rem;">⚠️ Partial (₹${displayAmount})</span>
                    <button class="btn-rec-small" onclick="generateInvoice('${student._id}', '${month}', ${year}, ${isFamily}, '${familyCode}')">🧾 रसीद</button>`;
    } else if (status === 'advance') {
      statusHtml = `<span style="color:#0c6075; font-weight:bold; margin-right:0.4rem;">⏭️ Advance (₹${displayAmount})</span>
                    <button class="btn-rec-small" onclick="generateInvoice('${student._id}', '${month}', ${year}, ${isFamily}, '${familyCode}')">🧾 रसीद</button>`;
    } else {
      statusHtml = `<button onclick="quickPayFromHisab('${student._id}', '${month}', ${year}, ${isFamily}, '${familyCode}')" style="background:#dc3545; color:white; border:none; padding:3px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer;">⏳ बाकी (Mark Paid)</button>`;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight: 600;">1 ${month} ${year}</td>
      <td style="color: ${paidOn === 'बाकी' ? '#dc3545' : '#1a7a4a'}; font-weight: 500;">${paidOn}</td>
      <td>${statusHtml}</td>
    `;
    tbody.appendChild(tr);
  });

  if (rowsAdded === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#999;">जुलाई 2026 से हिसाब शुरू होगा</td></tr>`;
  }
}

function generateInvoice(studentId, month, year, isFamily, familyCode) {
  const student = students.find(s => s._id === studentId);
  if (!student) return;

  const fee = student.fees?.find(f => f.month === month && f.year === year);
  if (!fee) return;

  let lastRecNo = localStorage.getItem('lastReceiptNumber') || '1000';
  let nextRecNo = parseInt(lastRecNo) + 1;
  
  const storageKey = `rec_${studentId}_${month}_${year}`;
  let currentRecNo = localStorage.getItem(storageKey);
  if (!currentRecNo) {
    currentRecNo = nextRecNo;
    localStorage.setItem('lastReceiptNumber', nextRecNo);
    localStorage.setItem(storageKey, nextRecNo);
  }

  document.getElementById('recNo').innerText = currentRecNo;
  document.getElementById('recDate').innerText = fee.paidOn || getFormattedTodayDate();
  document.getElementById('recStudentName').innerText = isFamily ? `${familyCode} परिवार (${student.name})` : student.name;
  document.getElementById('recBatch').innerText = student.batch || 'Class Room';
  document.getElementById('recMonth').innerText = `${month} ${year}`;
  document.getElementById('recAmount').innerText = `₹${fee.paidAmount}`;
  
  if (fee.note) {
    document.getElementById('recNoteRow').style.display = 'block';
    document.getElementById('recNote').innerText = fee.note;
  } else {
    document.getElementById('recNoteRow').style.display = 'none';
  }

  const waReceiptText = `*SHADAB COACHING CENTER*\n-------------------------------\n*फीस रसीद (Fee Receipt)*\n-------------------------------\n*रसीद संख्या:* #${currentRecNo}\n*दिनांक:* ${fee.paidOn || getFormattedTodayDate()}\n*छात्र का नाम:* ${student.name}\n*बैच:* ${student.batch || 'N/A'}\n*फीस महीना:* ${month} ${year}\n*जमा राशि:* ₹${fee.paidAmount}\n*स्थिति:* PAID (वसूल)\n-------------------------------\n_उज्जवल भविष्य की ओर पहला कदम। धन्यवाद!_`;
  
  const shareBtn = document.getElementById('btnShareReceiptWA');
  shareBtn.onclick = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(waReceiptText)}`, '_blank');
  };

  document.getElementById('receiptModal').classList.add('open');
}

async function quickPayFromHisab(studentId, month, year, isFamily, familyCode) {
  const student = students.find(s => s._id === studentId);
  
  let paymentAmount = student ? student.monthlyFee : 0;
  if (isFamily && familyCode) {
    const familyMembers = students.filter(s => s.familyCode === familyCode);
    paymentAmount = familyMembers.reduce((sum, m) => sum + (m.monthlyFee || 0), 0);
  }

  const data = { month, year, status: 'paid', paidAmount: paymentAmount, note: 'हिसाब से डायरेक्ट जमा' };
  try {
    const url = isFamily ? `${API}/family/${familyCode}/fees` : `${API}/${studentId}/fees`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('अपडेट नहीं हो पाया');
    
    const res = await fetch(API);
    students = await res.json();
    calculateDashboardStats(students);
    renderStudents(students);
    
    if (isFamily) openHisabModalForFamily(familyCode); else openHisabModal(studentId);
    
    setTimeout(() => {
      generateInvoice(studentId, month, year, isFamily, familyCode);
    }, 400);

  } catch (err) { showCustomAlert('Error: ' + err.message); }
}

async function saveFees() {
  const data = {
    month: currentMonth,
    year: currentYear,
    status: document.getElementById('markStatus').value,
    paidAmount: parseInt(document.getElementById('markAmount').value) || 0,
    note: document.getElementById('markNote').value.trim()
  };
  try {
    const url = isFamilyMark ? `${API}/family/${window.currentFamilyCode}/fees` : `${API}/${currentStudent._id}/fees`;
    const response = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!response.ok) throw new Error('अपडेट करने में असमर्थ');
    closeModal('markModal');
    loadStudents();
  } catch (err) { showCustomAlert('Error: ' + err.message); }
}

function showFamilyOptions(code) {
  const members = students.filter(s => s.familyCode === code);
  const names = members.map(m => m.name).join(', ');
  showCustomConfirm(`"${code}" family delete करें?\n(${names})\n\nसिर्फ एक member हटाना हो तो Cancel करें और कार्ड खोलें।`, () => { deleteFamily(code); });
}

async function deleteFamily(code) {
  try {
    const response = await fetch(`${API}/family/${code}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('डिलीट करने में विफल');
    loadStudents();
  } catch (err) { showCustomAlert('Error: ' + err.message); }
}

function deleteStudent(id, name) {
  showCustomConfirm(`"${name}" को सूची से हटाएं?`, async () => {
    try {
      const response = await fetch(`${API}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('हटाने में विफल');
      loadStudents();
    } catch (err) { showCustomAlert('Error: ' + err.message); }
  });
}

function closeModal(id) { document.getElementById(id).classList.remove('open'); }
loadStudents();