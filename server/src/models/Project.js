// src/models/Project.js
import mongoose from 'mongoose';

// Node schema for file/folder representation
const nodeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // unique identifier (e.g., UUID)
    parentId: { type: String, default: null }, // null for root nodes
    name: { type: String, required: true },
    type: { type: String, enum: ['file', 'folder'], required: true },
    content: { type: String, default: '' }, // only for files
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    nodes: { type: [nodeSchema], default: [] },
    version: { type: Number, default: 1 },
    chat: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
