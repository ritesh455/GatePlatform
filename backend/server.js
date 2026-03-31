// server.js (Unified Version)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require('path');

const db = require("./config/database");

const http = require("http");
const { Server  } = require("socket.io");

// RESTORED DEPENDENCIES (from old server.js)
const { connectDB } = require("./config/database"); // Assuming connectDB is exported from database.js
const authRoutes = require('./routes/authRoutes'); // NEW AUTH ROUTES
const studyMaterialRoutes = require("./routes/studyMaterials");
const mockTestRoutes = require("./routes/mockTests");
const chapterRoutes = require("./routes/chapters");
const testResultRoutes = require("./routes/testResults");
const chatbotRoutes = require("./routes/chatbotRoutes");

const systemAdminRoutes = require('./routes/SystemRoute'); 
const fetchAdminRoutes = require('./routes/fetchAdminRoute');
const adminHistoryRoutes = require("./routes/adminHistoryRoutes");
const communityRoutes = require("./routes/communityRoutes");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;


// --- Socket.IO Setup for Real-Time Chat ---
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://gate-platform-nqmo.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.set("io", io);

io.on("connection", (socket) => {

  console.log("User connected:", socket.id);

  // Join personal room
  socket.on("joinUserRoom", (userNo) => {

    socket.join(`user_${userNo}`);

    console.log(`User ${userNo} joined personal room`);

  });

  socket.on("typing", (data) => {

  const { groupId, userNo } = data;

  socket.to(`group_${groupId}`).emit("userTyping", {
    groupId,
    userNo
  });

});

  // Join chat room
  socket.on("joinRoom", (groupId) => {

    socket.join(`group_${groupId}`);

    console.log(`User joined group ${groupId}`);

  });

  // Send message
  socket.on("sendMessage", async (data) => {

    try {

      const { groupId, senderId, message } = data;

      await db.query(
        `INSERT INTO group_messages (group_id, sender_user_no, message)
         VALUES ($1,$2,$3)`,
        [groupId, senderId, message]
      );

      io.to(`group_${groupId}`).emit("receiveMessage", {
        groupId,
        sender_user_no: senderId,
        message,
        created_at: new Date()
      });

    } catch (error) {

      console.error("Socket message error:", error);

    }

  });

  socket.on("disconnect", () => {

    console.log("User disconnected:", socket.id);

  });

});
// --- Security and Middleware ---

// Security middleware
app.use(helmet());

// CORS Configuration
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://gate-platform-nqmo.vercel.app"
  ],
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Body parsing middleware (RESTORED from old server.js to handle larger bodies)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));





// 2. System Admin Login Routes 
app.use('/api/system-admin', systemAdminRoutes);

// 3. Admin Data Management Routes 
app.use('/api/admin', fetchAdminRoutes);

app.use("/api/admin-history", adminHistoryRoutes);

//chat bot routes
app.use("/api/chatbot", chatbotRoutes);




// --- File Serving ---

// Serve uploaded admin degree files from /uploads (from new server.js)
// Access files via: http://localhost:5000/api/uploads/<filename>
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve PDF and study materials from /public folder
// Access files via: http://localhost:5000/public/<filename>
app.use('/public', express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    // Allow PDFs to be viewed inline in the browser, not downloaded
    if (path.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
    }
  }
}));


//community routes
app.use("/api/community", communityRoutes);


// --- API Routes ---

// Routes for Auth (new file upload and controller logic)
app.use("/api/auth", authRoutes);
// Rest of the application routes (from old server.js)
app.use("/api/study-materials", studyMaterialRoutes);
app.use("/api/mock-tests", mockTestRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/test-results", testResultRoutes);

app.get("/", (req, res) => {
  res.status(200).send("OK");
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Educational Platform API is running",
        timestamp: new Date().toISOString(),
    })
});


// --- Error Handling ---

// 404 handler (placed before general error handler)
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route Not Found' });
});


// Error handling middleware (Final Fallback)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV !== "production",
        error: "Something went wrong!",
    });
});


// --- Start Server ---
const startServer = async () => {
    try {
        // Test database connection (Requires connectDB to be exported from database.js)
        await connectDB();
        console.log("Database connected successfully");

        server.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Health check endpoint ready at /health`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();