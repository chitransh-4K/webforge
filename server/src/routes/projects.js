// src/routes/projects.js
import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import Project from '../models/Project.js';
import { BadRequestError, UnauthorizedError } from '../utils/errors.js';
import { z } from 'zod';

const router = express.Router();

// Validation schemas using Zod
const nodeSchema = z.object({
  id: z.string(),
  parentId: z.string().nullable().optional(),
  name: z.string(),
  type: z.enum(['file', 'folder']),
  content: z.string().optional(),
});

const createProjectSchema = z.object({
  name: z.string().min(1),
  nodes: z.array(nodeSchema).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  nodes: z.array(nodeSchema).optional(),
  version: z.number(),
});

// Helpers for size limits
const MAX_FILES = 200;
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
const MAX_PROJECT_SIZE = 5 * 1024 * 1024; // 5 MB

function calculateProjectSize(nodes = []) {
  return nodes.reduce((sum, n) => {
    if (n.type === 'file' && n.content) {
      return sum + Buffer.byteLength(n.content, 'utf8');
    }
    return sum;
  }, 0);
}

// List projects for the authenticated user
router.get('/', requireAuth, async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.user._id }).select('name version createdAt updatedAt');
    res.json({ projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new project
router.post('/', requireAuth, async (req, res) => {
  try {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.format() });
    }
    const { name, nodes = [] } = parsed.data;
    if (nodes.length > MAX_FILES) {
      return res.status(400).json({ error: `Project cannot exceed ${MAX_FILES} files` });
    }
    const totalSize = calculateProjectSize(nodes);
    if (totalSize > MAX_PROJECT_SIZE) {
      return res.status(400).json({ error: `Project size exceeds ${MAX_PROJECT_SIZE / 1024 / 1024} MB` });
    }
    const project = await Project.create({ owner: req.user._id, name, nodes, version: 1 });
    res.status(201).json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a specific project
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a project (optimistic concurrency)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const parsed = updateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.format() });
    }
    const { name, nodes, version } = parsed.data;
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.version !== version) {
      return res.status(409).json({ error: 'Version conflict – project has been modified elsewhere' });
    }
    // Validate limits if nodes are being updated
    if (nodes) {
      if (nodes.length > MAX_FILES) {
        return res.status(400).json({ error: `Project cannot exceed ${MAX_FILES} files` });
      }
      const totalSize = calculateProjectSize(nodes);
      if (totalSize > MAX_PROJECT_SIZE) {
        return res.status(400).json({ error: `Project size exceeds ${MAX_PROJECT_SIZE / 1024 / 1024} MB` });
      }
      project.nodes = nodes;
    }
    if (name) project.name = name;
    project.version += 1;
    await project.save();
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a project
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const result = await Project.deleteOne({ _id: req.params.id, owner: req.user._id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Import guest project into a logged‑in account
router.post('/import-guest', requireAuth, async (req, res) => {
  try {
    // Expected payload: { name: string, nodes: array }
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.format() });
    }
    const { name, nodes = [] } = parsed.data;
    if (nodes.length > MAX_FILES) {
      return res.status(400).json({ error: `Project cannot exceed ${MAX_FILES} files` });
    }
    const totalSize = calculateProjectSize(nodes);
    if (totalSize > MAX_PROJECT_SIZE) {
      return res.status(400).json({ error: `Project size exceeds ${MAX_PROJECT_SIZE / 1024 / 1024} MB` });
    }
    const project = await Project.create({ owner: req.user._id, name, nodes, version: 1 });
    res.status(201).json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get project chat history
router.get('/:id/chat', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ messages: project.chat || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Clear project chat history
router.delete('/:id/chat', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.chat = [];
    await project.save();
    res.json({ message: 'Chat history cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
