const textGenerator = require('../text/textGenerator');
const codeGenerator = require('../code/codeGenerator');
const visionOCR = require('../vision/visionOCR');
const websiteGenerator = require('../website/websiteGenerator');

async function runTask(type, params = {}) {
  switch (type) {
    case 'text':
      if (!params.goal) {
        const error = new Error('Goal is required for text generation');
        error.status = 400;
        throw error;
      }
      return await textGenerator.generate(params.goal, params.context);

    case 'code':
      if (!params.goal) {
        const error = new Error('Goal is required for code generation');
        error.status = 400;
        throw error;
      }
      return await codeGenerator.generate(params.goal, params.language, params.context);

    case 'website':
      if (!params.goal) {
        const error = new Error('Goal is required for website generation');
        error.status = 400;
        throw error;
      }
      return await websiteGenerator.generate(params.goal, params.context);

    case 'vision': {
      const input = params.imagePathOrUrl || params.imageUrl || params.image;
      if (!input) {
        const error = new Error('Image path, URL, or buffer is required for vision OCR');
        error.status = 400;
        throw error;
      }
      return await visionOCR.extractText(input);
    }

    case 'repair':
      if (!params.goal || !params.previousOutput || !params.errorMessage) {
        const error = new Error('Goal, previousOutput, and errorMessage are required for repair');
        error.status = 400;
        throw error;
      }
      if (params.taskType === 'WEBSITE_GENERATION' || (params.previousOutput && (params.previousOutput.includes('<html') || params.previousOutput.includes('<!DOCTYPE')))) {
        return await websiteGenerator.repair(params.goal, params.previousOutput, params.errorMessage, params.context);
      }
      return await textGenerator.repair(params.goal, params.previousOutput, params.errorMessage, params.context);

    default: {
      const error = new Error(`Unknown task type: ${type}`);
      error.status = 400;
      throw error;
    }
  }
}

module.exports = {
  runTask,
};
