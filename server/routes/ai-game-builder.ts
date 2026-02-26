import { RequestHandler } from "express";
import { query } from "../db/connection";
import { emitAIEvent } from "../socket";

// Create a new game builder project
export const createGameBuilderProject: RequestHandler = async (req, res) => {
  try {
    const { title, description, source_url } = req.body;
    const admin_id = (req as any).admin?.id;

    const result = await query(
      `INSERT INTO ai_game_builder_projects (title, description, source_url, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, description || null, source_url || null, admin_id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all game builder projects
export const getGameBuilderProjects: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM ai_game_builder_projects ORDER BY created_at DESC`
    );

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get a specific game builder project with versions
export const getGameBuilderProject: RequestHandler = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await query(
      `SELECT * FROM ai_game_builder_projects WHERE id = $1`,
      [projectId]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    const versions = await query(
      `SELECT * FROM ai_game_versions WHERE project_id = $1 ORDER BY created_at DESC`,
      [projectId]
    );

    res.json({
      success: true,
      data: { ...project.rows[0], versions: versions.rows },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update game builder project
export const updateGameBuilderProject: RequestHandler = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, status } = req.body;

    const result = await query(
      `UPDATE ai_game_builder_projects
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [title || null, description || null, status || null, projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete game builder project
export const deleteGameBuilderProject: RequestHandler = async (req, res) => {
  try {
    const { projectId } = req.params;

    await query(`DELETE FROM ai_game_builder_projects WHERE id = $1`, [projectId]);

    res.json({ success: true, message: "Project deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Save a game version (auto-save or manual)
export const saveGameVersion: RequestHandler = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { game_data, step_completed, preview_url } = req.body;

    // Get the latest version number
    const latestVersion = await query(
      `SELECT MAX(version_number) as max_version FROM ai_game_versions WHERE project_id = $1`,
      [projectId]
    );

    const nextVersion = (latestVersion.rows[0]?.max_version || 0) + 1;

    const result = await query(
      `INSERT INTO ai_game_versions (project_id, version_number, game_data, step_completed, preview_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [projectId, nextVersion, JSON.stringify(game_data), step_completed, preview_url || null]
    );

    // Emit real-time update
    emitAIEvent("game_version_saved", {
      projectId,
      version: nextVersion,
      step: step_completed,
    });

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get specific game version
export const getGameVersion: RequestHandler = async (req, res) => {
  try {
    const { versionId } = req.params;

    const result = await query(
      `SELECT * FROM ai_game_versions WHERE id = $1`,
      [versionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Version not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Restore a previous version
export const restoreGameVersion: RequestHandler = async (req, res) => {
  try {
    const { projectId, versionId } = req.params;

    // Get the version to restore
    const versionToRestore = await query(
      `SELECT * FROM ai_game_versions WHERE id = $1 AND project_id = $2`,
      [versionId, projectId]
    );

    if (versionToRestore.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Version not found" });
    }

    const version = versionToRestore.rows[0];

    // Create a new version with restored data
    const latestVersion = await query(
      `SELECT MAX(version_number) as max_version FROM ai_game_versions WHERE project_id = $1`,
      [projectId]
    );

    const nextVersion = (latestVersion.rows[0]?.max_version || 0) + 1;

    const result = await query(
      `INSERT INTO ai_game_versions (project_id, version_number, game_data, step_completed, preview_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [projectId, nextVersion, version.game_data, "restored", version.preview_url]
    );

    emitAIEvent("game_version_restored", {
      projectId,
      restoredFromVersion: version.version_number,
      newVersion: nextVersion,
    });

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
