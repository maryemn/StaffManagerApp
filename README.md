# Staff Management Dashboard

This is a simple Staff and Department Management Dashboard built with Node.js, MongoDB, and a front-end using HTML/CSS/JS.

---

## Prerequisites

Before running the project, make sure you have the following installed:

- **Node.js**: [Download and install](https://nodejs.org/en/download)  
- **MongoDB Community Edition**: [Download and install](https://www.mongodb.com/try/download/community)  

---

## Setup Instructions

1. **Clone or copy the project** to your local machine.  

2. **Backend**:

   - Open a terminal in the `Backend` folder.
   - Run the following command to start the server:
     ```bash
     node server.js
     ```
   - The backend server will run on `http://localhost:3000` by default.

3. **Frontend**:

   - Open the `index.html` file in **VS Code**.
   - Install the **Live Server** extension in VS Code (if not already installed).  
   - Right-click on `index.html` and select **Open with Live Server**.  
   - Your dashboard should now be running in the browser.

---

## Features

- View and manage employees and departments.
- Add, edit, and delete employees and departments.
- Dashboard cards for total employees, total departments, and active departments.
- Search and filter employees.
- Status indicators for employees and departments.

---

## Notes

- Make sure MongoDB is running before starting the backend server.
- The backend runs on port `3000` by default. Update your front-end fetch URLs if you change the backend port.
