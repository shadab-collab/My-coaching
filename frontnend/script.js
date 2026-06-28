const API = '/api/students';
const MONTHS = ['JN','FB','MR','AP','MY','JU','JL','AG','SP','OC','NV','DC'];
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

let students = [];
let currentStudent = null;
let currentMonth = null;
let currentYear = null;

// ── DATA LOAD ──
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

  container.innerHTML = list.map(student => {
    const isDue = hasDue(student);
    const headerClass = student.verify ? 'verify' : isDue ? 'due' : '';
    
    return `
    <div class="student-card">
      <div class="student-header ${headerClass}" 
           onclick="toggleFees('${student._id}')">
        <div>
          <div class="student-name">
            ${student.familyCode ? 
              `<span style="color:#666;font-size:0.8rem">${student.familyCode} </span>` : ''}
            ${student.name}
            ${student.verify ? ' <span style="color:#fd7e14">⚠️</span>' : ''}
          </div>
          <div class="student-meta">
            Class ${student.class || '-'} • 
            ${student.board || 'Bihar'} • 
            Due: ${student.dueDate} तारीख • 
            ₹${student.monthlyFee || 0}/month
          </div>
        </div>
        <div class="student-badges">
          ${isDue ? '<span class="badge badge-red">Due</span>' : 
                    '<span class="badge badge-green">Clear</span>'}
          <span style="font-size:1.2rem">▾</span>
        </div>
      </div>
      <div class="fees-row" id="fees-${student._id}" style="display:none">
        ${renderMonthBtns(student)}
        <button onclick="openMarkModal('${student._id}', null, null)" 
          style="background:#eee;border:none;padding:0.3rem 0.6rem;
                 border-radius:6px;font-size:0.75rem;cursor:pointer">
          + Month Add
        </button>
      </div>
    </div>`;
  }).join('');
}

function renderMonthBtns(student) {
  const currentYear = new Date().getFullYear();
  const months = ['JN','FB','MR','AP','MY','JU','JL','AG','SP','OC','NV','DC'];
  
  return months.map((m, i) => {
    const fee = student.fees?.find(f => f.month === m && f.year === currentYear);
    const status = fee ? fee.status : 'unpaid';
    const cls = `month-${status}`;
    const note = fee?.note ? ` (${fee.note})` : '';
    
    return `<button class="month-btn ${cls}" 
      onclick="openMarkModal('${student._id}', '${m}', ${currentYear})">
      ${m}${note}
    </button>`;
  }).join('');
}

function toggleFees(id) {
  const el = document.getElementById(`fees-${id}`);
  el.style.display = el.style.display === 'none' ? 'flex' : 'none';
  el.style.flexWrap = 'wrap';
}

function hasDue(student) {
  const now = new Date();
  const currentMonth = MONTHS[now.getMonth()];
  const currentYear = now.getFullYear();
  const fee = student.fees?.find(f => 
    f.month === currentMonth && f.year === currentYear
  );
  return !fee || fee.status === 'unpaid' || fee.status === 'partial';
}

// ── FILTER ──
function filterStudents() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const filter = document.getElementById('filterDue').value;
  
  let filtered = students.filter(s => {
    const name = (s.familyCode + ' ' + s.name).toLowerCase();
    return name.includes(search);
  });
  
  if (filter === 'due') {
    filtered = filtered.filter(s => hasDue(s));
  } else if (filter === '01') {
    filtered = filtered.filter(s => s.dueDate === 1);
  } else if (filter === '15') {
    filtered = filtered.filter(s => s.dueDate === 15);
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
    familyCode: document.getElementById('newFamilyCode').value.trim(),
    fatherName: document.getElementById('newFatherName').value.trim(),
    class: document.getElementById('newClass').value.trim(),
    board: document.getElementById('newBoard').value,
    dueDate: parseInt(document.getElementById('newDueDate').value),
    monthlyFee: parseInt(document.getElementById('newFee').value) || 0,
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
    // Clear fields
    ['newName','newFamilyCode','newFatherName',
     'newClass','newFee','newJoinDate'].forEach(id => {
      document.getElementById(id).value = '';
    });
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// ── MARK FEES ──
function openMarkModal(studentId, month, year) {
  currentStudent = students.find(s => s._id === studentId);
  currentMonth = month || MONTHS[new Date().getMonth()];
  currentYear = year || new Date().getFullYear();
  
  const existing = currentStudent.fees?.find(
    f => f.month === currentMonth && f.year === currentYear
  );
  
  document.getElementById('markInfo').textContent = 
    `${currentStudent.name} — ${currentMonth} ${currentYear}`;
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
    await fetch(`${API}/${currentStudent._id}/fees`, {
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

// ── MODAL ──
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// ── INIT ──
loadStudents();
