/**
 * @file useProject.js
 * @module hooks
 *
 * Custom hook for project CRUD operations.
 *
 * Returns:
 *   { projects, loading, error, createProject, deleteProject, refresh }
 */

import { useState, useEffect, useCallback } from 'react';
import projectService from '@/services/projectService';

export function useProject() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await projectService.getProjects();
      setProjects(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const createProject = useCallback(async (goal) => {
    const project = await projectService.createProject(goal);
    setProjects((prev) => [project, ...prev]);
    return project;
  }, []);

  const deleteProject = useCallback(async (id) => {
    await projectService.deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { projects, loading, error, createProject, deleteProject, refresh };
}
