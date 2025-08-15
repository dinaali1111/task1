// Student Manager with enhanced functionality
// - CRUD (add, edit, delete)
// - Search, sort, bulk select/delete
// - Persistence (localStorage)
// - CSV export, stats, toast notifications, theme toggle

// DOM refs
const el = (id) => document.getElementById(id);
const tbody = document.querySelector('#Table tbody');

const addBtn = el('addStudentBtn');
const updateBtn = el('updateStudentBtn');
const resetBtn = el('resetFormBtn');
const searchInput = el('searchInput');
const selectAll = el('selectAll');
const deleteSelectedBtn = el('deleteSelectedBtn');
const exportCsvBtn = el('exportCsvBtn');
const clearAllBtn = el('clearAllBtn');
const toast = el('toast');
const themeToggle = el('themeToggle');

// State
let students = [];
let sortState = { key: 'id', dir: 'asc' }; // or 'desc'
let filterText = '';
let editId = null;

// Storage helpers
const STORAGE_KEY = 'students_v1';
const THEME_KEY = 'theme_pref_v1';
const load = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(students));

// Toast helper
function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.classList.remove('show'), 1800);
}

// Utilities
function nextId() {
    const max = students.reduce((m, s) => Math.max(m, s.id), 0);
    return max + 1;
}

function validate(name, age) {
    const errors = [];
    if (!name || name.trim().length < 3) errors.push('Name must be at least 3 characters.');
    const ageNum = Number(age);
    if (!Number.isFinite(ageNum) || ageNum <= 18) errors.push('Age must be greater than 18.');
    return { valid: errors.length === 0, errors, age: ageNum, name: name.trim() };
}

function clearForm() {
    el('studentName').value = '';
    el('studentAge').value = '';
    editId = null;
    el('editId').value = '';
    updateBtn.classList.add('hidden');
    addBtn.classList.remove('hidden');
}

function setFormForEdit(student) {
    el('studentName').value = student.name;
    el('studentAge').value = student.age;
    editId = student.id;
    el('editId').value = String(student.id);
    addBtn.classList.add('hidden');
    updateBtn.classList.remove('hidden');
}

// Render
function render() {
    const q = filterText.toLowerCase();

    let list = students.filter(s =>
        String(s.id).includes(q) ||
        s.name.toLowerCase().includes(q) ||
        String(s.age).includes(q)
    );

    list.sort((a, b) => {
        const { key, dir } = sortState;
        const mul = dir === 'asc' ? 1 : -1;
        if (key === 'name') return a.name.localeCompare(b.name) * mul;
        return (a[key] - b[key]) * mul;
    });

    // tbody
    tbody.innerHTML = '';
    for (const s of list) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="select-col"><input type="checkbox" class="row-select" data-id="${s.id}"></td>
            <td>${s.id}</td>
            <td>${escapeHtml(s.name)}</td>
            <td>${s.age}</td>
            <td>
                <div class="actions-col">
                    <button class="action-icon edit" title="Edit" data-action="edit" data-id="${s.id}"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="action-icon delete" title="Delete" data-action="delete" data-id="${s.id}"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>`;
        tbody.appendChild(tr);
    }

    // stats
    el('statTotal').textContent = String(students.length);
    const avg = students.length ? (students.reduce((sum, s) => sum + Number(s.age), 0) / students.length) : 0;
    el('statAvg').textContent = avg.toFixed(1);

    updateBulkUi();
}

function updateBulkUi() {
    const anyChecked = !!document.querySelector('.row-select:checked');
    deleteSelectedBtn.disabled = !anyChecked;
    const all = document.querySelectorAll('.row-select');
    const checked = document.querySelectorAll('.row-select:checked');
    selectAll.checked = all.length > 0 && all.length === checked.length;
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// Actions
function addStudent() {
    const name = el('studentName').value;
    const age = el('studentAge').value;
    const { valid, errors, name: nm, age: ag } = validate(name, age);
    if (!valid) { showToast(errors.join(' '), 'warn'); return; }

    const exists = students.some(st => st.name.toLowerCase() === nm.toLowerCase() && Number(st.age) === ag);
    if (exists) { showToast('Student already exists.', 'warn'); return; }

    const student = { id: nextId(), name: nm, age: ag };
    students.push(student);
    save();
    render();
    clearForm();
    showToast('Student added.', 'ok');
}

function updateStudent() {
    if (editId == null) return;
    const name = el('studentName').value;
    const age = el('studentAge').value;
    const { valid, errors, name: nm, age: ag } = validate(name, age);
    if (!valid) { showToast(errors.join(' '), 'warn'); return; }

    const idx = students.findIndex(s => s.id === editId);
    if (idx >= 0) {
        // prevent duplicate other than itself
        const exists = students.some(st => st.id !== editId && st.name.toLowerCase() === nm.toLowerCase() && Number(st.age) === ag);
        if (exists) { showToast('Another student with same data exists.', 'warn'); return; }
        students[idx] = { ...students[idx], name: nm, age: ag };
        save();
        render();
        clearForm();
        showToast('Student updated.', 'ok');
    }
}

function deleteStudent(id) {
    students = students.filter(s => s.id !== id);
    save();
    render();
    showToast('Student deleted.', 'ok');
}

function deleteSelected() {
    const ids = Array.from(document.querySelectorAll('.row-select:checked')).map(cb => Number(cb.dataset.id));
    if (ids.length === 0) return;
    students = students.filter(s => !ids.includes(s.id));
    save();
    render();
    showToast('Selected students deleted.', 'ok');
}

function clearAll() {
    if (!confirm('Clear all students?')) return;
    students = [];
    save();
    render();
    clearForm();
    showToast('All students cleared.', 'ok');
}

function exportCsv() {
    if (!students.length) { showToast('No data to export.', 'warn'); return; }
    const header = ['ID', 'Name', 'Age'];
    const rows = students.map(s => [s.id, '"' + String(s.name).replace(/"/g, '""') + '"', s.age]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('CSV exported.', 'ok');
}

// Sort header click
function onSortClick(e) {
    const th = e.target.closest('th');
    if (!th || !th.dataset.sort) return;
    const key = th.dataset.sort;
    if (sortState.key === key) {
        sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
    } else {
        sortState = { key, dir: 'asc' };
    }
    render();
}

// Theme
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

function initTheme() {
    const saved = localStorage.getItem(THEME_KEY) || 'dark';
    applyTheme(saved);
    themeToggle.checked = saved === 'light';
}

function toggleTheme() {
    const theme = themeToggle.checked ? 'light' : 'dark';
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
}

// Event bindings
addBtn.addEventListener('click', addStudent);
updateBtn.addEventListener('click', updateStudent);
resetBtn.addEventListener('click', clearForm);
exportCsvBtn.addEventListener('click', exportCsv);
clearAllBtn.addEventListener('click', clearAll);
deleteSelectedBtn.addEventListener('click', deleteSelected);
themeToggle.addEventListener('change', toggleTheme);

searchInput.addEventListener('input', (e) => { filterText = e.target.value; render(); });

// table events (delegation)
document.querySelector('#Table thead').addEventListener('click', onSortClick);
tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;
    if (action === 'edit') {
        const s = students.find(s => s.id === id);
        if (s) setFormForEdit(s);
    }
    if (action === 'delete') {
        deleteStudent(id);
    }
});

// selection
selectAll.addEventListener('change', () => {
    document.querySelectorAll('.row-select').forEach(cb => { cb.checked = selectAll.checked; });
    updateBulkUi();
});
tbody.addEventListener('change', (e) => {
    if (e.target.classList.contains('row-select')) updateBulkUi();
});

// Init
function init() {
    initTheme();
    students = load();
    render();
}

document.addEventListener('DOMContentLoaded', init);














