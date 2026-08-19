/**
 * @file mockData.js
 * @module services
 *
 * Realistic mock data for GENERATIVE AI FOR EVERYONE.
 * Consumed by all *Service files when USE_MOCK=true.
 * Replace / remove when Person 2's backend API is ready.
 *
 * IMPORTANT: Never import this file directly from UI components.
 * Always go through the service layer (agentService, projectService, etc.)
 */

// ─── Task Status constants (mirror backend workflow/constants.js) ─────────────
export const TaskStatus = {
  PENDING:   'PENDING',
  READY:     'READY',
  RUNNING:   'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED:    'FAILED',
  RETRYING:  'RETRYING',
  BLOCKED:   'BLOCKED',
};

export const WorkflowStatus = {
  PENDING:   'PENDING',
  RUNNING:   'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED:    'FAILED',
  PAUSED:    'PAUSED',
};

export const TaskType = {
  TEXT_GENERATION:    'TEXT_GENERATION',
  CODE_GENERATION:    'CODE_GENERATION',
  WEBSITE_GENERATION: 'WEBSITE_GENERATION',
  VALIDATION:         'VALIDATION',
  OTHER:              'OTHER',
};

// ─── Mock Projects ────────────────────────────────────────────────────────────
export const MOCK_PROJECTS = [
  {
    id: 'proj-1',
    title: 'EcoCampus Launch',
    goal: 'Create a launch package for an eco-friendly campus startup — website, content, and code.',
    status: 'ACTIVE',
    taskCount: 5,
    completedTasks: 3,
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: 'proj-2',
    title: 'AI Product Concept',
    goal: 'Synthesize pitch brief, landing page, and code for new SaaS productivity tool.',
    status: 'COMPLETED',
    taskCount: 7,
    completedTasks: 7,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'proj-3',
    title: 'Smart Agriculture Suite',
    goal: 'Generate crop telemetry website, sensor code hooks, and market analysis document.',
    status: 'DRAFT',
    taskCount: 4,
    completedTasks: 0,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'proj-4',
    title: 'Quantum Fleet Engine',
    goal: 'Formulate logistics optimization workflow with reactive monitoring dashboard.',
    status: 'ACTIVE',
    taskCount: 6,
    completedTasks: 4,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── Mock Workflow ────────────────────────────────────────────────────────────
export const MOCK_WORKFLOW_TEMPLATE = (goal) => ({
  id: `wf-${Date.now()}`,
  projectId: 'proj-1',
  goal,
  status: WorkflowStatus.PENDING,
  createdAt: new Date().toISOString(),
  tasks: [
    {
      id: 'task-1',
      type: TaskType.TEXT_GENERATION,
      title: 'Generate Content',
      description: 'Create high-quality launch copy, product descriptions, and marketing narrative.',
      status: TaskStatus.PENDING,
      dependencies: [],
      output: null,
      error: null,
      startedAt: null,
      completedAt: null,
    },
    {
      id: 'task-2',
      type: TaskType.CODE_GENERATION,
      title: 'Generate Application Code',
      description: 'Build the core application logic with React components and utility functions.',
      status: TaskStatus.PENDING,
      dependencies: ['task-1'],
      output: null,
      error: null,
      startedAt: null,
      completedAt: null,
    },
    {
      id: 'task-3',
      type: TaskType.WEBSITE_GENERATION,
      title: 'Generate Website',
      description: 'Synthesize a complete multi-page website incorporating the generated content and code.',
      status: TaskStatus.PENDING,
      dependencies: ['task-1', 'task-2'],
      output: null,
      error: null,
      startedAt: null,
      completedAt: null,
    },
    {
      id: 'task-4',
      type: TaskType.VALIDATION,
      title: 'Validate Output',
      description: 'Run structural, syntax, and quality validation checks across all generated assets.',
      status: TaskStatus.PENDING,
      dependencies: ['task-3'],
      output: null,
      error: null,
      startedAt: null,
      completedAt: null,
    },
  ],
});

// ─── Simulated Mock Outputs ───────────────────────────────────────────────────
export const MOCK_TASK_OUTPUTS = {
  'task-1': {
    type: 'TEXT',
    content: `# EcoCampus — Launch Brief

**EcoCampus** is a next-generation sustainability platform built for modern university campuses. We help institutions track, reduce, and report their carbon footprint through intelligent automation and real-time telemetry.

## Core Value Proposition
- AI-powered energy optimization reduces campus consumption by up to 32%
- Real-time dashboards give facilities teams actionable intelligence
- Automated sustainability reporting meets all accreditation requirements

## Target Audience
University administrators, sustainability officers, and student organizations committed to measurable environmental impact.`,
    wordCount: 112,
    model: 'llama-3.3-70b-versatile',
    latencyMs: 1420,
  },
  'task-2': {
    type: 'CODE',
    language: 'javascript',
    code: `// EcoCampus — Carbon Tracker Utility
function calculateCarbonFootprint(energyKwh, transportKm, wasteKg) {
  const ENERGY_FACTOR = 0.233;   // kg CO2e per kWh (UK grid average)
  const TRANSPORT_FACTOR = 0.21; // kg CO2e per km (average vehicle)
  const WASTE_FACTOR = 0.5;      // kg CO2e per kg waste

  return {
    energy:    energyKwh    * ENERGY_FACTOR,
    transport: transportKm  * TRANSPORT_FACTOR,
    waste:     wasteKg      * WASTE_FACTOR,
    total:     (energyKwh * ENERGY_FACTOR) +
               (transportKm * TRANSPORT_FACTOR) +
               (wasteKg * WASTE_FACTOR),
  };
}

export default calculateCarbonFootprint;`,
    linesOfCode: 17,
    valid: true,
  },
  'task-3': {
    type: 'WEBSITE',
    files: ['index.html', 'styles.css', 'app.js', 'dashboard.html'],
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>EcoCampus — Sustainable Intelligence</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header class="hero">
    <h1>EcoCampus</h1>
    <p>Intelligent sustainability for modern universities.</p>
    <a href="#dashboard" class="cta">View Dashboard</a>
  </header>
</body>
</html>`,
    pageCount: 4,
    buildLog: '[MockBuildSandbox] Build OK. Files: index.html, styles.css, app.js, dashboard.html',
  },
  'task-4': {
    type: 'VALIDATION',
    status: 'PASSED',
    checks: [
      { name: 'executionSucceeded', status: 'PASS' },
      { name: 'outputExists',       status: 'PASS' },
      { name: 'filesPresent',       status: 'PASS' },
      { name: 'indexHtmlExists',    status: 'PASS' },
      { name: 'contentPresent',     status: 'PASS' },
    ],
    valid: true,
    score: 0.97,
  },
};

// ─── Recent Activity ──────────────────────────────────────────────────────────
export const MOCK_ACTIVITY = [
  {
    id: 'act-1',
    text: 'Validation engine approved all 5 checks for EcoCampus Launch.',
    time: '8 minutes ago',
    type: 'success',
  },
  {
    id: 'act-2',
    text: 'Website generation completed: 4 files synthesized for EcoCampus.',
    time: '12 minutes ago',
    type: 'success',
  },
  {
    id: 'act-3',
    text: 'Code generation produced 17-line carbon tracker utility.',
    time: '18 minutes ago',
    type: 'success',
  },
  {
    id: 'act-4',
    text: 'AI Generation Engine compiled React bundle for AI Product Concept.',
    time: '1 hour ago',
    type: 'info',
  },
  {
    id: 'act-5',
    text: 'Validation engine approved AST checks for Quantum Fleet Engine.',
    time: '3 hours ago',
    type: 'success',
  },
];
