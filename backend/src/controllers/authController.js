import User from '../models/User.js';
import Project from '../models/Project.js';
import History from '../models/History.js';
import generateToken from '../utils/generateToken.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          bio: user.bio,
          role: user.role,
          preferredModel: user.preferredModel,
          avatarColor: user.avatarColor,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('[AUTH] Register error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.',
    });
  }
};

/**
 * @desc    Login with email and password
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    // Include password field for comparison (excluded by default)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          bio: user.bio,
          role: user.role,
          preferredModel: user.preferredModel,
          avatarColor: user.avatarColor,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('[AUTH] Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
};

/**
 * @desc    Get current authenticated user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    // req.user is attached by authMiddleware.protect
    const user = req.user;
    return res.status(200).json({
      success: true,
      message: 'User profile retrieved.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio || 'Generative AI Developer & Prompt Engineer',
        role: user.role || 'Full Stack AI Engineer',
        preferredModel: user.preferredModel || 'openai/gpt-oss-20b',
        avatarColor: user.avatarColor || '#D4AF37',
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error fetching profile.',
    });
  }
};

/**
 * @desc    Update user profile details (name, bio, role, preferredModel, avatarColor)
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, bio, role, preferredModel, avatarColor } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name && name.trim()) user.name = name.trim();
    if (bio !== undefined) user.bio = String(bio).trim();
    if (role !== undefined) user.role = String(role).trim();
    if (preferredModel !== undefined) user.preferredModel = String(preferredModel).trim();
    if (avatarColor !== undefined) user.avatarColor = String(avatarColor).trim();

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        role: user.role,
        preferredModel: user.preferredModel,
        avatarColor: user.avatarColor,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('[AUTH] updateProfile error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating profile.',
    });
  }
};

/**
 * @desc    Change user password securely
 * @route   PUT /api/auth/password
 * @access  Private
 */
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    console.error('[AUTH] updatePassword error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error changing password.',
    });
  }
};

/**
 * @desc    Get user real-time dashboard and profile usage statistics
 * @route   GET /api/auth/stats
 * @access  Private
 */
export const getProfileStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [
      totalProjects,
      completedProjects,
      runningProjects,
      failedProjects,
      totalHistoryEvents,
      recentProjects,
    ] = await Promise.all([
      Project.countDocuments({ userId }),
      Project.countDocuments({ userId, status: 'completed' }),
      Project.countDocuments({ userId, status: 'running' }),
      Project.countDocuments({ userId, status: 'failed' }),
      History.countDocuments({ userId }),
      Project.find({ userId }).sort({ updatedAt: -1 }).limit(5),
    ]);

    const successRate = totalProjects > 0
      ? Math.round((completedProjects / totalProjects) * 100)
      : 100;

    return res.status(200).json({
      success: true,
      message: 'User statistics retrieved.',
      data: {
        totalProjects,
        completedProjects,
        runningProjects,
        failedProjects,
        totalGenerations: totalHistoryEvents,
        successRate,
        recentProjects: recentProjects.map((p) => ({
          id: p._id,
          title: p.title,
          status: p.status,
          prompt: p.prompt,
          updatedAt: p.updatedAt,
        })),
      },
    });
  } catch (error) {
    console.error('[AUTH] getProfileStats error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving user statistics.',
    });
  }
};
