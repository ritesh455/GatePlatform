const validateRegistration = (req, res, next) => {
  // Check if a file was uploaded (only required for admin)
  const degreeFile = req.file;

  // Destructure body, which contains all text fields (including file details in req.body for form-data)
  const { username, email, password, role } = req.body;

  // Basic validation
  if (!username || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: 'Username, email, password, and role are required',
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format',
    });
  }

  // Password strength validation
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long',
    });
  }

  // Role validation
  if (role !== 'student' && role !== 'admin') {
    return res.status(400).json({
      success: false,
      message: 'Role must be either student or admin',
    });
  }

  // Student-specific validation (using branch, gender, city, state)
  if (role === 'student') {
    const { branch, gender, city, state } = req.body;
    if (!branch || !gender || !city || !state) {
      return res.status(400).json({
        success: false,
        message: 'Branch, gender, city, and state are required for students',
      });
    }
  }

  // Admin-specific validation (using phone, branch, and file upload)
  if (role === 'admin') {
    const { phone, branch } = req.body;
    if (!phone || !branch) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and branch are required for admins',
      });
    }
    // Check if the file (M.Tech degree) was actually uploaded
    if (!degreeFile) {
      return res.status(400).json({
        success: false,
        message: 'M.Tech degree file is required for admins',
      });
    }
  }

  next();
};

module.exports = { validateRegistration };