document.addEventListener('DOMContentLoaded', function () {
    const addHomeworkBtn = document.getElementById('addHomeworkBtn');
    const homeworkForm = document.getElementById('homeworkForm');
    const assignmentForm = document.getElementById('assignmentForm');
    const editForm = document.getElementById('editForm');
    const prevWeekBtn = document.getElementById('prevWeekBtn');
    const nextWeekBtn = document.getElementById('nextWeekBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    let currentWeekStart = new Date(); // Track the start of the current week
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay()); // Set to start of the week (Sunday)

    let assignments = {}; // Store assignments by date (YYYY-MM-DD)
    let currentEditingAssignment = null; // Track the assignment being edited
    let assignmentBoxToEdit = null; // Track the assignment box being interacted with

    updateWeekView();

    // Helper function to format date as YYYY-MM-DD
    function formatDate(date) {
        date.setHours(12, 0, 0, 0);
        return date.toISOString().split('T')[0];
    }

    // Helper function to format date for input
    function formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }

    // Helper function to darken a color
    function darkenColor(color) {
        let colorValue = color.replace(/^#/, '');
        if (colorValue.length === 6) {
            colorValue = colorValue.match(/../g);
        } else if (colorValue.length === 3) {
            colorValue = colorValue.split('').map(c => c + c);
        }
        colorValue = colorValue.map(hex => Math.max(0, parseInt(hex, 16) - 30).toString(16).padStart(2, '0')).join('');
        return `#${colorValue}`;
    }

    // Toggle the visibility of the homework form
    if (addHomeworkBtn && homeworkForm) {
        addHomeworkBtn.addEventListener('click', function () {
            if (homeworkForm.style.display === 'none' || homeworkForm.style.display === '') {
                homeworkForm.style.display = 'block'; // Show the form
                addHomeworkBtn.style.display = 'none'; // Hide the add button
            } else {
                homeworkForm.style.display = 'none'; // Hide the form
                addHomeworkBtn.style.display = 'block'; // Show the add button
            }
        });
    }

    // Cancel button functionality
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function () {
            homeworkForm.style.display = 'none'; // Hide the form
            addHomeworkBtn.style.display = 'block'; // Show the add button
        });
    }

    // Function to update the week view based on the current week start
    function updateWeekView() {
        const currentDate = new Date(); // Get current date for highlighting today

        daysOfWeek.forEach((day, index) => {
            const dayElement = document.getElementById(day);

            const dayDate = new Date(currentWeekStart);
            dayDate.setDate(currentWeekStart.getDate() + index); // Correct date calculation

            // Set the date below the day name
            dayElement.innerHTML = `<h3>${day.charAt(0).toUpperCase() + day.slice(1)}</h3><p>${formatDate(dayDate)}</p>`;

            // Clear previous assignments
            dayElement.querySelectorAll('.assignment-box').forEach(box => box.remove());

            // Load assignments for the current day
            const dayKey = formatDate(dayDate);
            if (assignments[dayKey]) {
                assignments[dayKey].forEach(assignment => {
                    const assignmentBox = createAssignmentBox(assignment);
                    dayElement.appendChild(assignmentBox);
                });
            }

            // Highlight only today
            if (formatDate(dayDate) === formatDate(currentDate)) {
                dayElement.style.backgroundColor = '#ADD8E6'; // Highlight today
            } else {
                dayElement.style.backgroundColor = ''; // Remove highlight for other days
            }
        });
    }

    // Create assignment box element
    function createAssignmentBox(assignment) {
        const assignmentBox = document.createElement('div');
        assignmentBox.classList.add('assignment-box');
        const boxColor = assignment.color || '#ff6347'; // Default color
        assignmentBox.style.backgroundColor = boxColor;

        // Assignment content
        assignmentBox.innerHTML = `
            <input type="checkbox" class="assignment-checkbox" ${assignment.completed ? 'checked' : ''}>
            <span>${assignment.name} ${assignment.className}</span>
            <div class="action-buttons" style="display: none;">
                <button class="delete-btn" style="padding-left: 10px; background-color: ${darkenColor(boxColor)};">Delete</button>
                <button class="cancel-btn" style="padding-left: 10px; background-color: ${darkenColor(boxColor)};">Cancel</button>
            </div>
        `;

        const checkbox = assignmentBox.querySelector('.assignment-checkbox');
        const actionButtons = assignmentBox.querySelector('.action-buttons');
        const deleteBtn = assignmentBox.querySelector('.delete-btn');
        const cancelBtn = assignmentBox.querySelector('.cancel-btn');

        // Function to handle strikethrough and desaturation when checked
        function applyCheckedStyle() {
            assignmentBox.style.filter = 'grayscale(70%)'; // Desaturate
            assignmentBox.style.textDecoration = 'line-through'; // Apply strikethrough
            actionButtons.style.display = 'flex'; // Show buttons but disable interaction
            actionButtons.style.pointerEvents = 'none'; // Disable button functionality
        }

        // Function to handle normal style when unchecked
        function removeCheckedStyle() {
            assignmentBox.style.filter = ''; // Remove desaturation
            assignmentBox.style.textDecoration = 'none'; // Remove strikethrough
            actionButtons.style.display = 'none'; // Hide buttons
            actionButtons.style.pointerEvents = 'auto'; // Re-enable button functionality
        }

        // Apply styles based on completion status on load
        if (assignment.completed) {
            applyCheckedStyle();
        }

        // Event listener for checkbox toggle (checked/unchecked)
        checkbox.addEventListener('change', function () {
            const assignmentDate = formatDate(new Date(assignment.dueDate));

            // Update completion status in assignments object
            assignment.completed = checkbox.checked;

            // Update the completion status in localStorage
            saveAssignmentsToStorage();

            // Apply or remove styles based on checkbox status
            if (checkbox.checked) {
                applyCheckedStyle();
            } else {
                removeCheckedStyle();
            }
        });

        // Show action buttons when clicking the assignment box (only if not checked)
        assignmentBox.addEventListener('click', function () {
            if (!checkbox.checked) {
                actionButtons.style.display = 'flex'; // Show action buttons
            }
        });

        // Handle delete button click
        deleteBtn.addEventListener('click', function (event) {
            event.stopPropagation(); // Prevent triggering the assignment box click

            // Confirm deletion
            if (confirm('Are you sure you want to delete this assignment?')) {
                // Find the date of the assignment
                const assignmentDate = formatDate(new Date(assignment.dueDate));

                // Remove assignment from the assignments object
                if (assignments[assignmentDate]) {
                    assignments[assignmentDate] = assignments[assignmentDate].filter(a => a.name !== assignment.name || a.className !== assignment.className);

                    // If no more assignments for the date, delete the date from the object
                    if (assignments[assignmentDate].length === 0) {
                        delete assignments[assignmentDate];
                    }
                }

                // Save updated assignments to localStorage
                saveAssignmentsToStorage();

                // Remove the assignment box from the DOM
                assignmentBox.remove();
            }
        });

        // Handle cancel button click (optional functionality)
        cancelBtn.addEventListener('click', function (event) {
            event.stopPropagation();
            actionButtons.style.display = 'none'; // Hide action buttons when 'Cancel' is clicked
        });

        return assignmentBox;
    }

    // Save assignments to localStorage
    function saveAssignmentsToStorage() {
        localStorage.setItem('assignments', JSON.stringify(assignments));
    }

    // Load assignments from localStorage
    function loadAssignmentsFromStorage() {
        const storedAssignments = localStorage.getItem('assignments');
        if (storedAssignments) {
            assignments = JSON.parse(storedAssignments);
            updateWeekView(); // Re-render the week view with loaded assignments
        }
    }

    // Load assignments on page load
    loadAssignmentsFromStorage();

    // Handle form submission for adding assignments
    if (assignmentForm) {
        assignmentForm.addEventListener('submit', function (event) {
            event.preventDefault(); // Prevent form submission

            const name = document.getElementById('name').value;
            const className = document.getElementById('class').value;
            const dueDate = new Date(document.getElementById('dueDate').value);
            dueDate.setDate(dueDate.getDate() + 1); // Adjust date
            const color = document.getElementById('color').value;
            const completed = false;

            if (name && className && dueDate) {
                const formattedDate = formatDate(dueDate);

                // Add the new assignment
                if (!assignments[formattedDate]) {
                    assignments[formattedDate] = [];
                }
                assignments[formattedDate].push({ name, className, dueDate, color, completed });

                // Save assignments to localStorage
                saveAssignmentsToStorage();

                // Update the week view
                updateWeekView();

                // Clear the form and hide it
                assignmentForm.reset();
                homeworkForm.style.display = 'none';
                addHomeworkBtn.style.display = 'block';
            }
        });
    }

    // Handle form submission for editing assignments
    if (editForm) {
        editForm.addEventListener('submit', function (event) {
            event.preventDefault(); // Prevent form submission

            const name = document.getElementById('editName').value;
            const className = document.getElementById('editClass').value;
            const dueDate = new Date(document.getElementById('editDueDate').value);
            dueDate.setDate(dueDate.getDate() + 1); // Adjust date
            const color = document.getElementById('editColor').value;
            const completed = document.getElementById('editCompleted').checked;

            if (name && className && dueDate) {
                const formattedDate = formatDate(dueDate);

                // Remove old assignment
                if (assignments[formattedDate]) {
                    assignments[formattedDate] = assignments[formattedDate].filter(a => a.name !== currentEditingAssignment.name || a.className !== currentEditingAssignment.className);
                    if (assignments[formattedDate].length === 0) {
                        delete assignments[formattedDate];
                    }
                }

                // Add updated assignment
                if (!assignments[formattedDate]) {
                    assignments[formattedDate] = [];
                }
                assignments[formattedDate].push({ name, className, dueDate, color, completed });

                // Save updated assignments to localStorage
                saveAssignmentsToStorage();

                // Update the week view
                updateWeekView();

                // Clear the form and hide it
                editForm.reset();
                editForm.style.display = 'none';
                addHomeworkBtn.style.display = 'block';
            }
        });
    }

    // Handle previous week button click
    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', function () {
            currentWeekStart.setDate(currentWeekStart.getDate() - 7);
            updateWeekView();
        });
    }

    // Handle next week button click
    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', function () {
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
            updateWeekView();
        });
    }
});