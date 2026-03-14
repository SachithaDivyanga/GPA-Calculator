document.addEventListener('DOMContentLoaded', function() {
    // Initialize courses array
    let courses = JSON.parse(localStorage.getItem('gpaCourses')) || [];
    
    // DOM Elements
    const courseNameInput = document.getElementById('courseName');
    const creditHoursInput = document.getElementById('creditHours');
    const gradeSelect = document.getElementById('grade');
    const addCourseBtn = document.getElementById('addCourse');
    const coursesTableBody = document.getElementById('coursesTableBody');
    const noCoursesMessage = document.getElementById('noCoursesMessage');
    const calculateGPABtn = document.getElementById('calculateGPA');
    const calculateServerBtn = document.getElementById('calculateServer');
    const resetAllBtn = document.getElementById('resetAll');
    
    // Result display elements
    const totalCreditsEl = document.getElementById('totalCredits');
    const totalGradePointsEl = document.getElementById('totalGradePoints');
    const gpaResultEl = document.getElementById('gpaResult');
    const coursesCountEl = document.getElementById('coursesCount');
    const serverResultEl = document.getElementById('serverResult');
    
    // Initialize the courses table
    renderCoursesTable();
    
    // Event Listeners
    addCourseBtn.addEventListener('click', addCourse);
    calculateGPABtn.addEventListener('click', calculateGPA);
    calculateServerBtn.addEventListener('click', calculateGPAServer);
    resetAllBtn.addEventListener('click', resetAll);
    
    // Allow Enter key to add course
    courseNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addCourse();
    });
    
    creditHoursInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addCourse();
    });
    
    // Add course function
    function addCourse() {
        const courseName = courseNameInput.value.trim();
        const creditHours = parseFloat(creditHoursInput.value);
        const gradeValue = parseFloat(gradeSelect.value);
        
        // Validation
        if (!courseName) {
            alert('Please enter a course name');
            courseNameInput.focus();
            return;
        }
        
        if (!creditHours || creditHours < 0.5 || creditHours > 5) {
            alert('Please enter valid credit hours (0.5 - 5)');
            creditHoursInput.focus();
            return;
        }
        
        if (isNaN(gradeValue)) {
            alert('Please select a grade');
            gradeSelect.focus();
            return;
        }
        
        // Add course to array
        const course = {
            id: Date.now(), // Unique ID
            name: courseName,
            credits: creditHours,
            grade: gradeValue,
            gradePoints: creditHours * gradeValue
        };
        
        courses.push(course);
        
        // Save to localStorage
        saveCoursesToLocalStorage();
        
        // Clear form
        courseNameInput.value = '';
        creditHoursInput.value = '';
        gradeSelect.value = '';
        courseNameInput.focus();
        
        // Update table
        renderCoursesTable();
        
        // Calculate GPA automatically
        calculateGPA();
    }
    
    // Delete course function
    function deleteCourse(id) {
        courses = courses.filter(course => course.id !== id);
        saveCoursesToLocalStorage();
        renderCoursesTable();
        calculateGPA();
    }
    
    // Render courses table
    function renderCoursesTable() {
        if (courses.length === 0) {
            coursesTableBody.innerHTML = '';
            noCoursesMessage.style.display = 'block';
            coursesTableBody.parentNode.style.display = 'none';
            return;
        }
        
        noCoursesMessage.style.display = 'none';
        coursesTableBody.parentNode.style.display = 'block';
        
        let tableHTML = '';
        
        courses.forEach(course => {
            // Get grade letter from value
            const gradeLetter = getGradeLetter(course.grade);
            
            tableHTML += `
                <tr>
                    <td>${course.name}</td>
                    <td>${course.credits}</td>
                    <td>${gradeLetter} (${course.grade})</td>
                    <td>${(course.credits * course.grade).toFixed(2)}</td>
                    <td>
                        <button class="delete-btn" onclick="deleteCourse(${course.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
        });
        
        coursesTableBody.innerHTML = tableHTML;
    }
    
    // Get grade letter from grade value
    function getGradeLetter(gradeValue) {
        const gradeMap = {
            4.0: 'A', 3.7: 'A-', 3.3: 'B+', 3.0: 'B',
            2.7: 'B-', 2.3: 'C+', 2.0: 'C', 1.7: 'C-',
            1.3: 'D+', 1.0: 'D', 0.0: 'F'
        };
        return gradeMap[gradeValue] || 'N/A';
    }
    
    // Calculate GPA (client-side)
    function calculateGPA() {
        if (courses.length === 0) {
            updateResults(0, 0, 0, 0);
            return;
        }
        
        let totalCredits = 0;
        let totalGradePoints = 0;
        
        courses.forEach(course => {
            totalCredits += course.credits;
            totalGradePoints += course.credits * course.grade;
        });
        
        const gpa = totalGradePoints / totalCredits;
        
        updateResults(totalCredits, totalGradePoints, gpa, courses.length);
    }
    
    // Update results display
    function updateResults(credits, gradePoints, gpa, count) {
        totalCreditsEl.textContent = credits.toFixed(1);
        totalGradePointsEl.textContent = gradePoints.toFixed(2);
        gpaResultEl.textContent = gpa.toFixed(2);
        coursesCountEl.textContent = count;
        
        // Color code GPA
        if (gpa >= 3.5) {
            gpaResultEl.style.color = '#27ae60';
        } else if (gpa >= 2.5) {
            gpaResultEl.style.color = '#f39c12';
        } else if (gpa > 0) {
            gpaResultEl.style.color = '#e74c3c';
        }
    }
    
    // Calculate GPA via server (PHP)
    async function calculateGPAServer() {
        if (courses.length === 0) {
            serverResultEl.textContent = 'No courses to calculate. Please add courses first.';
            serverResultEl.style.color = '#e74c3c';
            return;
        }
        
        try {
            serverResultEl.textContent = 'Calculating...';
            serverResultEl.style.color = '#3498db';
            
            // Prepare data to send
            const data = {
                courses: courses
            };
            
            // Send POST request to PHP backend
            const response = await fetch('calculate.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                serverResultEl.innerHTML = `
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #27ae60; margin-bottom: 10px;">
                            GPA: ${result.gpa.toFixed(2)}
                        </div>
                        <div style="font-size: 16px;">
                            Total Credits: ${result.totalCredits.toFixed(1)}<br>
                            Total Grade Points: ${result.totalGradePoints.toFixed(2)}<br>
                            Courses: ${result.coursesCount}
                        </div>
                    </div>
                `;
            } else {
                serverResultEl.textContent = `Error: ${result.message}`;
                serverResultEl.style.color = '#e74c3c';
            }
            
        } catch (error) {
            console.error('Error calculating GPA via server:', error);
            serverResultEl.textContent = `Error: ${error.message}`;
            serverResultEl.style.color = '#e74c3c';
        }
    }
    
    // Reset all data
    function resetAll() {
        if (confirm('Are you sure you want to reset all courses and calculations?')) {
            courses = [];
            saveCoursesToLocalStorage();
            renderCoursesTable();
            calculateGPA();
            serverResultEl.textContent = 'No server calculation yet';
            serverResultEl.style.color = '#2c3e50';
        }
    }
    
    // Save courses to localStorage
    function saveCoursesToLocalStorage() {
        localStorage.setItem('gpaCourses', JSON.stringify(courses));
    }
    
    // Make deleteCourse function globally available for inline onclick
    window.deleteCourse = deleteCourse;
});