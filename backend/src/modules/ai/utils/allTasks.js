const textGenerator = require('./textGenerator');
const codeGenerator = require('./codeGenerator');
const visionOCR = require('./visionOCR');

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
