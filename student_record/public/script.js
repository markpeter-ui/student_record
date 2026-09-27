const API = '/api/students';

const form = document.getElementById('studentForm');
const editId = document.getElementById('editId');
const studentIdInput = document.getElementById('student_id');
const nameInput = document.getElementById('name');
const programInput = document.getElementById('program');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const formTitle = document.getElementById('formTitle');
const table = document.getElementById('studentTable');
const emptyState = document.getElementById('emptyState');
const tableWrap = document.getElementById('tableWrap');
const alertBox = document.getElementById('alertBox');
const alertText = document.getElementById('alertText');
const alertIcon = document.getElementById('alertIcon');

let currentFilter = 'all';
let allStudents = [];

document.getElementById('year').textContent = new Date().getFullYear();

function showFeedback(text, type = 'success') {
    alertBox.className = `alert ${type}`;
    alertText.textContent = text;
    alertIcon.textContent = type === 'success' ? '✓' : (type === 'danger' ? '!' : 'i');
    alertBox.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { alertBox.style.display = 'none'; }, 4000);
}

async function loadStudents() {
    try {
        const res = await fetch(API);
        allStudents = await res.json();
        renderStats();
        renderTable();
    } catch (err) {
        showFeedback('Failed to load students: ' + err.message, 'danger');
    }
}

function renderStats() {
    const total = allStudents.length;
    const active = allStudents.filter(s => s.is_archived == 0).length;
    const archived = total - active;

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statActive').textContent = active;
    document.getElementById('statArchived').textContent = archived;
    document.getElementById('cntAll').textContent = total;
    document.getElementById('cntActive').textContent = active;
    document.getElementById('cntArchived').textContent = archived;
}

function renderTable() {
    let data = allStudents;
    if (currentFilter === 'active')   data = allStudents.filter(s => s.is_archived == 0);
    if (currentFilter === 'archived') data = allStudents.filter(s => s.is_archived == 1);

    if (!data.length) {
        emptyState.style.display = 'block';
        tableWrap.style.display = 'none';
        return;
    }
    emptyState.style.display = 'none';
    tableWrap.style.display = 'block';

    table.innerHTML = data.map(s => `
        <tr class="${s.is_archived == 1 ? 'archived' : ''}">
            <td><span class="id-badge">${escapeHtml(s.student_id)}</span></td>
            <td><strong>${escapeHtml(s.name)}</strong></td>
            <td>${escapeHtml(s.program)}</td>
            <td>
                <span class="badge ${s.is_archived == 1 ? 'archived' : 'active'}">
                    ${s.is_archived == 1 ? 'Archived' : 'Active'}
                </span>
            </td>
            <td>
                ${s.is_archived == 0 ? `
                    <div class="actions">
                        <button class="btn btn-sm btn-edit"
                            onclick="editStudent(${s.id}, '${escapeAttr(s.student_id)}', '${escapeAttr(s.name)}', '${escapeAttr(s.program)}')">
                            Edit
                        </button>
                        <button class="btn btn-sm btn-archive"
                            onclick="archiveStudent(${s.id})">
                            Archive
                        </button>
                    </div>
                ` : `
                    <div class="actions">
                        <button class="btn btn-sm btn-restore"
                            onclick="restoreStudent(${s.id})">
                            Restore
                        </button>
                    </div>
                `}
            </td>
        </tr>
    `).join('');
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c =>
        ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(str) {
    return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const student_id = studentIdInput.value.trim();
    const name = nameInput.value.trim();
    const program = programInput.value.trim();
    const id = editId.value;

    if (!student_id || !name || !program) {
        return showFeedback('⚠️ All fields are required.', 'danger');
    }

    try {
        let res, data;
        if (id && !isNaN(id)) {
            res = await fetch(`${API}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id, name, program })
            });
            data = await res.json();
            if (!res.ok) throw new Error(data.error);
            showFeedback(`✅ Student #${id} updated successfully!`, 'success');
        } else {
            res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id, name, program })
            });
            data = await res.json();
            if (!res.ok) throw new Error(data.error);
            showFeedback(`✅ Student '${name}' added successfully!`, 'success');
        }
        resetForm();
        loadStudents();
    } catch (err) {
        showFeedback('❌ Error: ' + err.message, 'danger');
    }
});

function editStudent(id, student_id, name, program) {
    editId.value = id;
    studentIdInput.value = student_id;
    nameInput.value = name;
    programInput.value = program;
    formTitle.innerText = 'Edit Student #' + id;
    saveBtn.innerText = 'Update';
    cancelBtn.style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
    editId.value = '';
    studentIdInput.value = '';
    nameInput.value = '';
    programInput.value = '';
    formTitle.innerText = 'Add New Student';
    saveBtn.innerText = 'Save';
    cancelBtn.style.display = 'none';
}

async function archiveStudent(id) {
    if (!confirm('Archive this record?\n\nIt will be hidden from Active list but STILL SAVED in the database.')) return;
    try {
        const res = await fetch(`${API}/archive/${id}`, { method: 'PUT' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        showFeedback(`📦 Student #${id} archived. Record is kept in database.`, 'warning');
        loadStudents();
    } catch (err) {
        showFeedback('❌ Archive error: ' + err.message, 'danger');
    }
}

async function restoreStudent(id) {
    if (!confirm('Restore this student to active list?')) return;
    try {
        const res = await fetch(`${API}/restore/${id}`, { method: 'PUT' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        showFeedback(`♻️ Student #${id} restored to active list.`, 'success');
        loadStudents();
    } catch (err) {
        showFeedback('❌ Restore error: ' + err.message, 'danger');
    }
}

document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
        renderTable();
    });
});

loadStudents();