// API डिक्लेरेशन और कॉन्फ़िगरेशन
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

// 1 जुलाई 2026 से क्लीन शुरुआत के लिए मंथ-फ़िल्टर फंक्शन
function isMonthBeforeJoin(monthName, year, joinDateStr) {
  const monthIdx = MONTHS.indexOf(monthName);
  let startYear = 2026;
  let startMonthIdx = 6; // 'JL' का इंडेक्स 6 होता है (जुलाई)

  if (joinDateStr) {
    const jd = new Date(joinDateStr);
    if (!isNaN(jd.getTime())) {
      startYear = jd.getFullYear();
      startMonthIdx = jd.getMonth();
    }
  }

  if (year < startYear) return true;
  if (year > startYear) return false;
  return monthIdx < startMonthIdx;
}

// कस्टम पॉपअप्स
function showCustomAlert(msg) {
  document.getElementById('customAlertMessage').innerText = msg;
  document.getElementById('customAlertModal').classList.add('open');
}

function showCustomConfirm(msg, onConfirmCallback) {
  document.getElementById('customConfirmMessage').innerText = msg;
  const yesBtn = document.getElementById('customConfirmYesBtn');
  const newYesBtn = yesBtn.cloneNode(true);
  yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
  newYesBtn.addEventListener('click', () => {
    closeModal('customConfirmModal');
    onConfirmCallback();
  });
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
    calculateDashboardStats(students); // लाइव स्टेट्स की गणना करें
    renderStudents(students);
  } catch (err) {
    console.error('Error:', err);
    showCustomAlert('डेटा लोड करने में समस्या: ' + err.message);
  }
}

// लाइव डैशबोर्ड स्टेट्स कैलकुलेशन (Phase 3 Dashboard & Reports)
function calculateDashboardStats(list) {
  let todayCollection = 0;
  let monthCollection = 0;
  let dueCount = 0;

  const todayStr = getFormattedTodayDate();
  const visible = getVisibleMonths();

  list.forEach(student => {
    // ड्यू स्टूडेंट काउंट करने के लिए
    if (hasDue(student)) {
      dueCount++;
    }

    // फीस कलेक्शन काउंट करने के लिए
    student.fees?.forEach(fee => {
      // आज का कलेक्शन
      if (fee.paidOn === todayStr && (fee.status === 'paid' || fee.status === 'partial' || fee.status === 'advance')) {
        todayCollection += (fee.paidAmount || 0);
      }
      // इस महीने का जमा
      if (fee.month === CUR_MONTH && fee.year === CUR_YEAR && (fee.status === 'paid' || fee.status === 'partial' || fee.status === 'advance')) {
        monthCollection += (fee.paidAmount || 0);
      }
    });
  });

  document.getElementById('statTodayCollection').innerText = `₹${todayCollection}`;
  document.getElementById('statMonthCollection').innerText = `₹${monthCollection}`;
  document.getElementById('statTotalDues').innerText = `${dueCount} छात्र`;
}

// तारीख फॉर्मेट करने का सामान्य हेल्पर
function getFormattedTodayDate() {
  const d = new Date();
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function renderStudents(list) {
  const container = document.getElementById('studentList');
  if (list.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:2rem;color:#666;">कोई student नहीं मिला</p>';
    return;
  }

  const groups = {};
  const solo = [];

  list.forEach(s => {
    if (s.familyCode) {
      if (!groups[s.familyCode]) groups[s.familyCode] = [];
      groups[s.familyCode].push(s);
    } else {
      solo.push(s);
    }
  });

  Object.keys(groups).forEach(code => {
    groups[code].sort((a, b) => a.name.localeCompare(b.name));
  });
  solo.sort((a, b) => a.name.localeCompare(b.name));

  let html = '';

  // 1. फ़ैमिली ग्रुप्स की रेंडरिंग (सुधरा और सुव्यवस्थित फ़ॉर्मेट)
  Object.keys(groups).sort().forEach(code => {
    const members = groups[code];
    const isDue = members.some(s => hasDue(s));
    const hasVerify = members.some(s => s.verify);
    const headerClass = hasVerify ? 'verify' : isDue ? 'due' : '';
    const fee = members[0].monthlyFee || 0;

    const namesOnly = members.map(m => m.name).join(' • ');
    const commonIdentity = members.find(m => m.identity && m.identity.trim() !== '')?.identity || '';
    const nameDisplay = `${namesOnly}${commonIdentity ? ' (' + commonIdentity + ')' : ''}`;
    const familyFeeType = members[0].isFamilyFee ? "Family Fee" : "Individual Fee";

    // व्हाट्सएप रिमाइंडर लिंक जेनरेट करना
    const reminderText = `अभिभावक कृपया ध्यान देंगे: SHADAB COACHING CENTER की ओर से सूचित किया जाता है कि छात्र ${namesOnly} (${code}) की ${CUR_MONTH} ${CUR_YEAR} महीने की फीस ₹${fee} बाकी है। कृपया शीघ्र अति शीघ्र भुगतान करें।`;
    const waReminderUrl = `https://wa.me/?text=${encodeURIComponent(reminderText)}`;

    html += `
    <div class="student-card">
      <div class="student-header ${headerClass}" onclick="toggleFees('grp-${code}')">
        <div>
          <div class="student-name">
            <span class="family-tag">${code}</span> ${nameDisplay}
            ${hasVerify ? ' <span style="color:#fd7e14">⚠️</span>' : ''}
          </div>
          <div class="student-meta">
            Due: ${members[0].dueDate} तारीख • 
            Type: <strong>${familyFeeType}</strong> •
            ${members[0].batch ? 'Batch ' + members[0].batch + ' • ' : ''}
            ₹${fee}/month
          </div>
        </div>
        <div class="student-badges">
          ${isDue ? '<span class="badge badge-red">Due</span>' : '<span class="badge badge-green">Clear</span>'}
          <button onclick="event.stopPropagation();openHisabModalForFamily('${code}')"
            style="background:#1a7a4a;color:white;border:none;border-radius:4px;font-size:0.75rem;font-weight:700;cursor:pointer;padding:0.3rem 0.6rem;margin-right:0.3rem;min-height:32px">📖 हिसाब</button>
          
          <!-- Phase 2 Smart Reminder Whatsapp Icon -->
          ${isDue ? `<a href="${waReminderUrl}" onclick="event.stopPropagation();" target="_blank" style="background:#25d366; color:white; border-radius:4px; font-size:0.75rem; font-weight:700; padding:0.35rem 0.6rem; margin-right:0.3rem; text-decoration:none; display:inline-block; text-align:center;">💬 Remind</a>` : ''}

          <button onclick="event.stopPropagation();showFamilyOptions('${code}')"
            style="background:#dc3545;color:white;border:none;border-radius:4px;font-size:0.75rem;font-weight:700;cursor:pointer;padding:0.3rem 0.6rem;min-width:40px;min-height:32px">Del</button>
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

  // 2. सिंगल (Solo) स्टूडेंट्स की रेंडरिंग
  solo.forEach(student => {
    const isDue = hasDue(student);
    const headerClass = student.verify ? 'verify' : isDue ? 'due' : '';
    const nameDisplay = `${student.name}${student.identity ? ' (' + student.identity + ')' : ''}`;
    const studentFeeType = student.isFamilyFee ? "Family Fee" : "Individual Fee";

    // व्हाट्सएप रिमाइंडर लिंक जेनरेट करना
    const reminderText = `अभिभावक कृपया ध्यान देंगे: SHADAB COACHING CENTER की ओर से सूचित किया जाता है कि छात्र ${student.name} की ${CUR_MONTH} ${CUR_YEAR} महीने की फीस ₹${student.monthlyFee} बाकी है। कृपया शीघ्र अति शीघ्र भुगतान करें।`;
    const waReminderUrl = `https://wa.me/?text=${encodeURIComponent(reminderText)}`;

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
          <button onclick="event.stopPropagation();openHisabModal('${student._id}')"
            style="background:#1a7a4a;color:white;border:none;border-radius:4px;font-size:0.75rem;font-weight:700;cursor:pointer;padding:0.3rem 0.6rem;margin-right:0.3rem;min-height:32px">📖 हिसाब</button>
          
          <!-- Phase 2 Smart Reminder Whatsapp Icon -->
          ${isDue ? `<a href="${waReminderUrl}" onclick="event.stopPropagation();" target="_blank" style="background:#25d366; color:white; border-radius:4px; font-size:0.75rem; font-weight:700; padding:0.35rem 0.6rem; margin-right:0.3rem; text-decoration:none; display:inline-block; text-align:center;">💬 Remind</a>` : ''}

          <button onclick="event.stopPropagation();deleteStudent('${student._id}','${student.name}')"
            style="background:#dc3545;color:white;border:none;border-radius:4px;font-size:0.75rem;font-weight:700;cursor:pointer;padding:0.3rem 0.6rem;min-width:40px;min-height:32px">Del</button>
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
    if (isMonthBeforeJoin(month, year, student.joinDate)) {
      return '';
    }
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
  if (isMonthBeforeJoin(CUR_MONTH, CUR_YEAR, student.joinDate)) {
    return false;
  }
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

function openAddModal() { document.getElementById('addModal').classList.add('open'); }

async function addStudent() {
  const name = document.getElementById('newName').value.trim();
  if (!name) { showCustomAlert('कृपया Student का नाम डालें!'); return; }

  const isFamilyFeeSelected = document.getElementById('radioFamily').checked;
  const data = {
    name,
    identity: document.getElementById('newIdentity').value.trim(),
    familyCode: document.getElementById('newFamilyCode').value.trim(),
    isFamilyFee: isFamilyFeeSelected,
    monthlyFee: parseInt(document.getElementById('newFee').value) || 0,
    batch: document.getElementById('newBatch').value,
    dueDate: parseInt(document.getElementById('newDueDate').value),
    joinDate: document.getElementById('newJoinDate').value,
  };

  try {
    const response = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('सर्वर एरर');
    closeModal('addModal');
    loadStudents();
    ['newName','newIdentity','newFamilyCode','newFee','newJoinDate'].forEach(id => { document.getElementById(id).value = ''; });
    document.getElementById('radioIndividual').checked = true;
  } catch (err) {
    showCustomAlert('Error: ' + err.message);
  }
}

function openMarkModal(studentId, month, year, isFamily, familyCode) {
  currentStudent = students.find(s => s._id === studentId);
  currentMonth = month || CUR_MONTH;
  currentYear = parseInt(year) || CUR_YEAR;
  isFamilyMark = isFamily;
  window.currentFamilyCode = familyCode;

  const existing = currentStudent.fees?.find(f => f.month === currentMonth && f.year === currentYear);
  const label = isFamily ? `${familyCode} family — ${currentMonth} ${currentYear}` : `${currentStudent.name} — ${currentMonth} ${currentYear}`;

  document.getElementById('markInfo').textContent = label;
  document.getElementById('markStatus').value = existing?.status || 'paid';
  document.getElementById('markAmount').value = existing?.paidAmount || currentStudent.monthlyFee || '';
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
  badge.innerText = parentStudent.isFamilyFee ? "Family Fee" : "Individual Fee";
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
    if (isMonthBeforeJoin(month, year, student.joinDate)) {
      return;
    }
    rowsAdded++;
    const fee = student.fees?.find(f => f.month === month && f.year === year);
    const status = fee ? fee.status : 'unpaid';
    const paidOn = fee ? fee.paidOn : 'बाकी';
    const amount = fee ? fee.paidAmount : (student.monthlyFee || 0);

    let statusHtml = '';
    if (status === 'paid') {
      statusHtml = `<span style="color:#1a7a4a; font-weight:bold; margin-right:0.4rem;">✅ Paid (₹${amount})</span>
                    <button class="btn-rec-small" onclick="generateInvoice('${student._id}', '${month}', ${year}, ${isFamily}, '${familyCode}')">🧾 रसीद</button>`;
    } else if (status === 'partial') {
      statusHtml = `<span style="color:#e6a817; font-weight:bold; margin-right:0.4rem;">⚠️ Partial (₹${amount})</span>
                    <button class="btn-rec-small" onclick="generateInvoice('${student._id}', '${month}', ${year}, ${isFamily}, '${familyCode}')">🧾 रसीद</button>`;
    } else if (status === 'advance') {
      statusHtml = `<span style="color:#0c6075; font-weight:bold; margin-right:0.4rem;">⏭️ Advance (₹${amount})</span>
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

// ऑटो रसीद जेनरेशन (Phase 2 Receipt System with Auto-Increment)
function generateInvoice(studentId, month, year, isFamily, familyCode) {
  const student = students.find(s => s._id === studentId);
  if (!student) return;

  const fee = student.fees?.find(f => f.month === month && f.year === year);
  if (!fee) return;

  // रसीद नंबर ऑटो इंक्रीमेंट के लिए लोकल स्टोरेज का उपयोग
  let lastRecNo = localStorage.getItem('lastReceiptNumber') || '1000';
  let nextRecNo = parseInt(lastRecNo) + 1;
  
  // अगर इस भुगतान के लिए पहले से कोई रसीद जनरेट नहीं की गई है, तो नया नंबर असाइन करें
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

  // रसीद का पेशेवर व्हाट्सएप संदेश तैयार करना
  const waReceiptText = `*SHADAB COACHING CENTER*\n-------------------------------\n*फीस रसीद (Fee Receipt)*\n-------------------------------\n*रसीद संख्या:* #${currentRecNo}\n*दिनांक:* ${fee.paidOn || getFormattedTodayDate()}\n*छात्र का नाम:* ${student.name}\n*बैच:* ${student.batch || 'N/A'}\n*फीस महीना:* ${month} ${year}\n*जमा राशि:* ₹${fee.paidAmount}\n*स्थिति:* PAID (वसूल)\n-------------------------------\n_उज्जवल भविष्य की ओर पहला कदम। धन्यवाद!_`;
  
  const shareBtn = document.getElementById('btnShareReceiptWA');
  shareBtn.onclick = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(waReceiptText)}`, '_blank');
  };

  document.getElementById('receiptModal').classList.add('open');
}

async function quickPayFromHisab(studentId, month, year, isFamily, familyCode) {
  const student = students.find(s => s._id === studentId);
  const data = { month, year, status: 'paid', paidAmount: student ? student.monthlyFee : 0, note: 'हिसाब से डायरेक्ट जमा' };
  try {
    const url = isFamily ? `${API}/family/${familyCode}/fees` : `${API}/${studentId}/fees`;
    const response = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!response.ok) throw new Error('अपडेट नहीं हो पाया');
    
    // डेटा रीलोड करें
    const res = await fetch(API);
    students = await res.json();
    calculateDashboardStats(students);
    renderStudents(students);
    
    if (isFamily) openHisabModalForFamily(familyCode); else openHisabModal(studentId);
    
    // भुगतान तुरंत होने के बाद रसीद दिखाएँ
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