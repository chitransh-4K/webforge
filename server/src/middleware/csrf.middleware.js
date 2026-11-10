// src/middleware/csrf.middleware.js
import { BadRequestError } from '../utils/errors.js';

/**
 * Simple CSRF protection middleware that expects the custom header
 * `X-Requested-With: XMLHttpRequest` on any state‑changing request
 * (POST, PUT, PATCH, DELETE). If the header is missing, the request is
 * rejected with a 400 error.
 */
export function csrfProtection(req, res, next) {
  const method = req.method.toUpperCase();
  const stateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  if (stateChanging) {
    const header = req.get('X-Requested-With');
    if (!header || header !== 'XMLHttpRequest') {
      return res.status(400).json({ error: 'Missing or invalid CSRF header' });
    }
  }
  next();
}
