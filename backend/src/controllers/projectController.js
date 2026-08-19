import Project from '../models/Project.js';
import History from '../models/History.js';

/**
 * @file projectController.js
 * @module controllers
 *
 * Project Controller - handles CRUD, AI output, and execution result persistence.
 * All routes are protected; req.user is set by authMiddleware.protect.
 */

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private
 */
export const createProject = async (req, res) => {
  try {
    const { title, prompt, projectType, tags } = req.body;
    if (!title || !prompt) {
      return res.status(400).json({ success: false, message: 'Please provide both title and prompt for the project.' });
    }
    const project = await Project.create({
      userId: req.user._id, title, prompt,
      projectType: projectType || 'general', status: 'pending', tags: tags || [],
    });
    await History.create({ userId: req.user._id, projectId: project._id, action: 'prompt_submitted', prompt: project.prompt, status: 'pending' });
    return res.status(201).json({ success: true, message: 'Project created successfully.', data: project });
  } catch (error) {
    console.error('[PROJECT] createProject error:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Server error creating project.' });
  }
};

/**
 * @desc    Get all projects for the authenticated user
 * @route   GET /api/projects
 * @access  Private
 */
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving projects.' });
  }
};

/**
 * @desc    Get a single project by ID (ownership enforced)
 * @route   GET /api/projects/:id
 * @access  Private
 */
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    if (project.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this project.' });
    }
    return res.status(200).json({ success: true, data: project });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error fetching project.' });
  }
};

/**
 * @desc    Update a project (ownership enforced)
 * @route   PUT /api/projects/:id
 * @access  Private
 */
export const updateProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    if (project.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this project.' });
    }
    const { userId: _ignored, ...safeUpdate } = req.body;
    project = await Project.findByIdAndUpdate(req.params.id, { $set: safeUpdate }, { new: true, runValidators: true });
    return res.status(200).json({ success: true, message: 'Project updated.', data: project });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error updating project.' });
  }
};

/**
 * @desc    Delete a project and its history (ownership enforced)
 * @route   DELETE /api/projects/:id
 * @access  Private
 */
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    if (project.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this project.' });
    }
    await Project.findByIdAndDelete(req.params.id);
    await History.deleteMany({ projectId: req.params.id });
    return res.status(200).json({ success: true, message: 'Project and its history deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error deleting project.' });
  }
};

/**
 * @desc    Save AI generation output for a project
 * @route   POST /api/projects/:id/ai-output
 * @access  Private
 */
export const saveAIOutput = async (req, res) => {
  try {
    const { generatedOutput, status, modelUsed } = req.body;
    let project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    if (project.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    project.generatedOutput = generatedOutput ?? project.generatedOutput;
    project.status = status || 'completed';
    await project.save();
    const history = await History.create({
      userId: req.user._id, projectId: project._id, action: 'generation_completed',
      prompt: project.prompt, output: project.generatedOutput, status: 'success',
      metadata: { modelUsed: modelUsed || 'default-llm' },
    });
    return res.status(200).json({ success: true, message: 'AI output saved.', data: { project, history } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error saving AI output.' });
  }
};

/**
 * @desc    Save execution/validation results
 * @route   POST /api/projects/:id/execution-result
 * @access  Private
 */
export const saveExecutionResult = async (req, res) => {
  try {
    const { executionStatus, executionLogs, errorTrace, executionTimeMs } = req.body;
    let project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    if (project.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    project.metadata = { ...project.metadata, executionStatus: executionStatus || 'completed', executionLogs: executionLogs || '', errorTrace: errorTrace || '' };
    project.status = executionStatus === 'failed' ? 'failed' : 'completed';
    await project.save();
    const history = await History.create({
      userId: req.user._id, projectId: project._id,
      action: executionStatus === 'failed' ? 'error_detected' : 'code_executed',
      prompt: project.prompt, output: project.generatedOutput,
      status: executionStatus === 'failed' ? 'failed' : 'success',
      executionLogs: executionLogs || '',
      metadata: { executionTimeMs: executionTimeMs || 0 },
    });
    return res.status(200).json({ success: true, message: 'Execution results saved.', data: { project, history } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error saving execution result.' });
  }
};