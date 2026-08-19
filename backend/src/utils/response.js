/**
 * Normalized response helpers.
 * Keeps all API responses in the consistent shape:
 *   success responses: { success: true, data, message }
 *   error responses:   { success: false, message }
 */

/**
 * Send a successful JSON response.
 *
 * @param {Response} res
 * @param {*}        data     — payload (object, array, null)
 * @param {string}   message  — human-readable message
 * @param {number}   status   — HTTP status code (default 200)
 */
export const sendSuccess = (res, data = null, message = 'Success', status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error JSON response.
 *
 * @param {Response} res
 * @param {string}   message  — error description
 * @param {number}   status   — HTTP status code (default 500)
 */
export const sendError = (res, message = 'Server Error', status = 500) => {
  return res.status(status).json({
    success: false,
    message,
  });
};
