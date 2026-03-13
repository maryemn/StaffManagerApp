//defining constants from the installed packages
const express = require("express"); //"require" from node module
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const morgan = require("morgan");
const winston = require("winston");

//defining the core application, and allowing acces to all the methods
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

mongoose.connect(
"mongodb+srv://nasseurmaryem7_db_user:MaRY2005@cluster0.rspa1xm.mongodb.net/&appName=Cluster0"
)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

//mongoose.connect(
//process.env.MONGODB_URI || "mongodb://localhost:27017/employee-management-app",
    //{
     // useNewUrlParser: true,
      //useUnifiedTopology: true,
  //  }
  //)
  //.then(() => console.log("Connected to MongoDB"))
  //.catch((err) => console.error("MongoDB connection error:", err));

// Configuring Winston Logger (from Winston documentation)
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

app.use(
  morgan(":method :url :status :response-time ms - :res[content-length]")
);

// Custom API Logger Middleware
const apiLogger = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      params: req.params,
      query: req.query,
      body: req.method !== "GET" ? req.body : undefined,
    });
  });
  next();
};

app.use(apiLogger);

// Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    params: req.params,
    query: req.query,
    body: req.method !== "GET" ? req.body : undefined,
  });

  res.status(500).json({ message: "Internal server error" });
});

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,  //two employees can't have the same email
    },
    department: {
      type: String,
       required: true,
    },
    joiningDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const Employee = mongoose.model("Employee", employeeSchema);

const departmentSchema = new mongoose.Schema(
    {
        name:{
            type: String,
            required: true,
            unique: true // we can't have two departments with the same name
        },
        description:{
            type: String,
            required: true
        },
        head: { 
          type: String,
          required: true 
        },            
        createdOn: { 
          type: Date,
          required: true 
          },           
        status:{
            type: String,
            enum:["active", "inactive"],
            default: "active"
        }
    },{
        timestamps: true
    }
);

const Department  = mongoose.model("Department", departmentSchema);

//Department Routes

 //http requests

app.get('/api/departments', async (req, res) =>{
      
       try {
         const departments = await Department.find().sort({ name: 1 });
         logger.info(`Retrieved ${departments.length} departments successfully`);
         res.json(departments);
       } catch (error) {
         logger.error("Error fetching departments:", error);
         res.status(500).json({ message: error.message });
       }
})

app.post("/api/departments", async (req, res) => {
  try {
    const department = new Department(req.body);
    const savedDepartment = await department.save();
    logger.info("New department created:", {
      departmentId: savedDepartment._id,
      name: savedDepartment.name,
    });
    res.status(201).json(savedDepartment);
  } catch (error) {
    logger.error("Error creating department:", error);
    res.status(400).json({ message: error.message });
  }
});

app.put("/api/departments/:id", async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!department) {
      logger.warn("Department not found for update:", { departmentId: req.params.id });
      return res.status(404).json({ message: "Department not found" });
    }
    logger.info("Department updated successfully:", {
      departmentId: department._id,
      name: department.name,
    });
    res.json(department);
  } catch (error) {
    logger.error("Error updating department:", error);
    res.status(400).json({ message: error.message });
  }
});

app.delete("/api/departments/:id", async (req, res) => {
  try {
    const enrolledEmployees = await Employee.countDocuments({
      department: req.params.id,
    });
    if (enrolledEmployees > 0) {
      logger.warn("Attempted to delete department with enrolled employees:", {
        departmentId: req.params.id,
        enrolledEmployees,
      });
      return res
        .status(400)
        .json({ message: "Cannot delete department with enrolled employees" });
    }

    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      logger.warn("Department not found for deletion:", {
        departmentId: req.params.id,
      });
      return res.status(404).json({ message: "Department not found" });
    }
    logger.info("Department deleted successfully:", {
      departmentId: department._id,
      name: department.name,
    });
    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    logger.error("Error deleting department:", error);
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/departments/:id", async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }
    res.json(department);
  } catch (error) {
    logger.error("Error fetching department:", error);
    res.status(500).json({ message: error.message });
  }
});

// Employee Routes
app.get("/api/employees", async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    logger.info(`Retrieved ${employees.length} employees successfully`);
    res.json(employees);
  } catch (error) {
    logger.error("Error fetching employees:", error);
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/employees", async (req, res) => {
  try {
    const employee = new Employee(req.body);
    const savedEmployee = await employee.save();
    logger.info("New employee created:", {
      employeeId: savedEmployee._id,
      name: savedEmployee.name,
      department: savedEmployee.department,
    });
    res.status(201).json(savedEmployee);
  } catch (error) {
    logger.error("Error creating employee:", error);
    res.status(400).json({ message: error.message });
  }
});

app.put("/api/employees/:id", async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!employee) {
      logger.warn("Employee not found for update:", {
        employeeId: req.params.id,
      });
      return res.status(404).json({ message: "Employee not found" });
    }
    logger.info("Employee updated successfully:", {
      employeeId: employee._id,
      name: employee.name,
      department: employee.department,
    });
    res.json(employee);
  } catch (error) {
    logger.error("Error updating employee:", error);
    res.status(400).json({ message: error.message });
  }
});

app.delete("/api/employees/:id", async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      logger.warn("Employee not found for deletion:", {
        employeeId: req.params.id,
      });
      return res.status(404).json({ message: "Employee not found" });
    }
    logger.info("Employee deleted successfully:", {
      employeeId: employee._id,
      name: employee.name,
      department: employee.department,
    });
    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    logger.error("Error deleting employee:", error);
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/employees/search", async (req, res) => {
  try {
    const searchTerm = req.query.q;
    logger.info("Employee search initiated:", { searchTerm });

    const employees = await Employee.find({
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { department: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
      ],
    });

    logger.info("Employee search completed:", {
      searchTerm,
      resultsCount: employees.length,
    });
    res.json(employees);
  } catch (error) {
    logger.error("Error searching employees:", error);
    res.status(500).json({ message: error.message });
  }
});

// Dashboard Stats
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const stats = await getDashboardStats();
        logger.info('Dashboard statistics retrieved successfully:', stats);
        res.json(stats);
    } catch (error) {
        logger.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: error.message });
    }
});

// Helper function for dashboard stats
async function getDashboardStats() {
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'active' });
    const totalDepartments = await Department.countDocuments();
    const activeDepartments = await Department.countDocuments({ status: 'active' });
    const inactiveEmployees = await Employee.countDocuments({ status: 'inactive' });
    const departmentCounts = await Employee.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    return {
        totalEmployees,
        activeEmployees,
        totalDepartments,
        activeDepartments,
        inactiveEmployees,
        departmentCounts
    };
}


// Basic health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        timestamp: new Date(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Detailed health check endpoint with MongoDB connection status
app.get('/health/detailed', async (req, res) => {
    try {
        // Check MongoDB connection
        const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
        
        // Get system metrics
        const systemInfo = {
            memory: {
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                unit: 'MB'
            },
            uptime: {
                seconds: Math.round(process.uptime()),
                formatted: formatUptime(process.uptime())
            },
            nodeVersion: process.version,
            platform: process.platform
        };

       // Response object
        const healthCheck = {
            status: 'UP',
            timestamp: new Date(),
            database: {
                status: dbStatus,
                name: 'MongoDB',
                host: mongoose.connection.host
            },
            system: systemInfo,
            environment: process.env.NODE_ENV || 'development'
        };

        res.status(200).json(healthCheck);
    } catch (error) {
        res.status(500).json({
            status: 'DOWN',
            timestamp: new Date(),
            error: error.message
        });
    }
});

//Get single employee by ID
app.get('/api/employees/:id', async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json(employee);
    } catch (error) {
        logger.error('Error fetching employee:', error);
        res.status(500).json({ message: error.message });
    }
});

// Helper function to format uptime
function formatUptime(seconds) {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);

    return parts.join(' ');
}


const PORT = process.env.PORT || 3000;

//starting the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
