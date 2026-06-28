const API = '/api/students';
const MONTHS = ['JN','FB','MR','AP','MY','JU','JL','AG','SP','OC','NV','DC'];
const CUR_YEAR = new Date().getFullYear();
const CUR_MONTH = MONTHS[new Date().getMonth()];

let students = [];
let currentStudent = null;
let currentMonth = null;
let currentYear = null;
let isFamilyMark = false;

// ── LOAD ──
async function loadStudents() {
  try {
    const res = await fetch(API);
    students = await res.json();
    renderStudents(students);
  } catch (err) {
    console.error('Error:', err);
  }
}

// ── RENDER ──
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

  let html = '';

  // Family groups
  Object.keys(groups).sort().forEach(code => {
    const members = groups[code];
    const isDue = members.some(s => hasDue(s));
    const hasVerify = members.some(s => s.verify);
    const headerClass = hasVerify ? 'verify' : isDue ? 'due' : '';
    const fee = members[0].monthlyFee || 0;

    html += `
    <div class="student-card">
      <div class="student-header ${headerClass}"
           onclick="toggleFees('grp-${code}')">
        <div>
          <div class="student-name">
            <span class="family-tag">${code}</span>
            ${members.map(m => m.name).join(' • ')}
            ${hasVerify ? ' <span style="color:#fd7e14">⚠️</span>' : ''}
          </div>
          <div class="student-meta">
            Due: ${members[0].dueDate} तारीख •
            ${members[0].batch ? 'Batch ' + members[0].batch + ' • ' : ''}
            ₹${fee}/month
          </div>
        </div>
        <div class="student-badges">
          ${isDue ? '<span class="badge badge-red">Due</span>' :
                    '<span class="badge badge-green">Clear</span>'}
          <button onclick="event.stopPropagation();showFamilyOptions('${code}')"
            style="background:none;border:none;font-size:1.2rem;
                   cursor:pointer;padding:0 0.3rem">⋮</button>
          <span>▾</span>
        </div>
      </div>
      <div class="fees-row" id="fees-grp-${code}" style="display:none">
        ${renderMonthBtns(members[0], code, true)}
        <div style="width:100%;margin-top:0.5rem;font-size:0.75rem;color:#666;
                    display:flex;flex-wrap:wrap;gap:0.5rem">
          ${members.map(m => `
            <span>
              ${m.name}:
              <button onclick="openMarkModal('${m._id}',null,null,false)"
                style="background:none;border:1px solid #ddd;border-radius:4px;
                       padding:0.1rem 0.4rem;font-size:0.7rem;cursor:pointer">
                अलग mark
              </button>
              <button onclick="deleteStudent('${m._id}','${m.name}')"
                style="background:none;border:1px solid #dc3545;color:#dc3545;
                       border-radius:4px;padding:0.1rem 0.4rem;
                       font-size:0.7rem;cursor:pointer">
                हटाएं
              </button>
            </span>`).join('')}
        </div>
      </div>
    </div>`;
  });

  // Solo students
  solo.forEach(student => {
    const isDue = hasDue(student);
    const headerClass = student.verify ? 'verify' : isDue ? 'due' : '';

    html += `
    <div class="student-card">
      <div class="student-header ${headerClass}"
           onclick="toggleFees('${student._id}')">
        <div>
          <div class="student-name">
            ${student.identity ?
              `<span style="color:#666;font-size:0.8rem">${student.identity} </span>` : ''}
            ${student.name}
            ${student.verify ? ' <span style="color:#fd7e14">⚠️</span>' : ''}
          </div>
          <div class="student-meta">
            Due: ${student.dueDate} तारीख •
            ${student.batch ? 'Batch ' + student.batch + ' • ' : ''}
            ₹${student.monthlyFee || 0}/month
          </div>
        </div>
        <div class="student-badges">
          ${isDue ? '<span class="badge badge-red">Due</span>' :
                    '<span class="badge badge-green">Clear</span>'}
          <button onclick="event.stopPropagation();deleteStudent('${student._id}','${student.name}')"
            style="background:none;border:none;font-size:1rem;
                   cursor:pointer;padding:0 0.3rem">🗑️</button>
          <span>▾</span>
        </div>
      </div>
      <div class="fees-row" id="fees-${student._id}" style="display:none">
        ${renderMonthBtns(student, student._id, false)}
      </div>
    </div>`;
  });

  container.innerHTML = html;
}

function renderMonthBtns(student, id, isFamily) {
  return MONTHS.map(m => {
    const fee = student.fees?.find(
      f => f.month === m && f.year === CUR_YEAR
    );
    const status = fee ? fee.status : 'unpaid';
    const cls = `month-${status}`;
    const note = fee?.note ? ` (${fee.note})` : '';

    return `<button class="month-btn ${cls}"
      onclick="openMarkModal('${student._id}','${m}',${CUR_YEAR},${isFamily},'${id}')">
      ${m}${note}
    </button>`;
  }).join('');
}

function toggleFees(id) {
  const el = document.getElementById(`fees-${id}`);
  if (!el) return;
  const isHidden = el.style.display === 'none';
  el.style.display = isHidden ? 'flex' : 'none';
  el.style.flexWrap = 'wrap';
  el.style.gap = '0.4rem';
}

function hasDue(student) {
  const fee = student.fees?.find(
    f => f.month === CUR_MONTH && f.year === CUR_YEAR
  );
  return !fee || fee.status === 'unpaid' || fee.status === 'partial';
}

// ── FILTER ──
function filterStudents() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const filter = document.getElementById('filterDue').value;

  let filtered = students.filter(s => {
    const fullName = ((s.identity || '') + ' ' +
                      s.name + ' ' +
                      (s.familyCode || '')).toLowerCase();
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

// ── ADD STUDENT ──
function openAddModal() {
  document.getElementById('addModal').classList.add('open');
}

async function addStudent() {
  const name = document.getElementById('newName').value.trim();
  if (!name) { alert('नाम डालें!'); return; }

  const data = {
    name,
    identity: document.getElementById('newIdentity').value.trim(),
    familyCode: document.getElementById('newFamilyCode').value.trim(),
    isFamilyFee: document.getElementById('newIsFamilyFee').checked,
    monthlyFee: parseInt(document.getElementById('newFee').value) || 0,
    batch: document.getElementById('newBatch').value,
    dueDate: parseInt(document.getElementById('newDueDate').value),
    joinDate: document.getElementById('newJoinDate').value,
  };

  try {
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    closeModal('addModal');
    loadStudents();
    ['newName','newIdentity','newFamilyCode','newFee','newJoinDate']
      .forEach(id => { document.getElementById(id).value = ''; });
    document.getElementById('newIsFamilyFee').checked = false;
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// ── MARK FEES ──
function openMarkModal(studentId, month, year, isFamily, familyCode) {
  currentStudent = students.find(s => s._id === studentId);
  currentMonth = month || CUR_MONTH;
  currentYear = year || CUR_YEAR;
  isFamilyMark = isFamily;
  window.currentFamilyCode = familyCode;

  const existing = currentStudent.fees?.find(
    f => f.month === currentMonth && f.year === currentYear
  );

  const label = isFamily ?
    `${familyCode} family — ${currentMonth} ${currentYear}` :
    `${currentStudent.name} — ${currentMonth} ${currentYear}`;

  document.getElementById('markInfo').textContent = label;
  document.getElementById('markStatus').value = existing?.status || 'paid';
  document.getElementById('markAmount').value =
    existing?.paidAmount || currentStudent.monthlyFee || '';
  document.getElementById('markNote').value = existing?.note || '';

  document.getElementById('markModal').classList.add('open');
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
    const url = isFamilyMark ?
      `${API}/family/${window.currentFamilyCode}/fees` :
      `${API}/${currentStudent._id}/fees`;

    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    closeModal('markModal');
    loadStudents();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// ── DELETE ──
function showFamilyOptions(code) {
  const members = students.filter(s => s.familyCode === code);
  const names = members.map(m => m.name).join(', ');
  if (confirm(`"${code}" family delete करें?\n(${names})\n\nसिर्फ एक member हटाना हो तो Cancel करें और card खोलें`)) {
    deleteFamily(code);
  }
}

async function deleteFamily(code) {
  try {
    await fetch(`${API}/family/${code}`, { method: 'DELETE' });
    loadStudents();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

async function deleteStudent(id, name) {
  if (confirm(`"${name}" को हटाएं?`)) {
    try {
      await fetch(`${API}/${id}`, { method: 'DELETE' });
      loadStudents();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }
}

// ── MODAL ──
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// ── INIT ──
loadStudents();
