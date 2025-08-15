

document.getElementById('addStudentBtn').addEventListener('click', addStudent);

let studentId = 1;
let students = [];

function addStudent() {
    const name = document.getElementById('studentName').value;
    const age = document.getElementById('studentAge').value;

    if (name.length < 3) {
        alert("Student name must be longer than 3 characters.");
        return;
    }

    if (age <= 18) {
        alert("Student age must be greater than 18.");
        return;
    }
    for (let student of students) {
        if (student.name === name && student.age === age) {
            alert("This student is already added.");
            return;
        }
    }

    students.push({ id: studentId, name: name, age: age });

    const table = document.getElementById('Table').getElementsByTagName('tbody')[0];
    const newRow = table.insertRow();
    newRow.innerHTML = `
        <td>${studentId}</td>
        <td>${name}</td>
        <td>${age}</td>
        <td><a href="#" onclick="deleteStudent(this)">Delete Student</a></td>
    `;

    studentId++;
}

function deleteStudent(link) {
    const row = link.parentNode.parentNode;
    const id = +(row.cells[0].innerText);

    students = students.filter(student => student.id !== id);

    row.parentNode.removeChild(row);
}














