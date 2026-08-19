/**
 * @file useWorkflow.js
 * @module hooks
 *
 * Manages the full workflow lifecycle.
 *
 * REAL MODE: Uses SSE streaming via startWorkflowStream().
 *   - Tasks update in real time as backend emits events
 *   - Healing state shown live as backend heals failures
 *
 * MOCK MODE: Uses local mock state + polling animation.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import agentService, { startWorkflowStream } from '@/services/agentService';
import { USE_MOCK } from '@/config/api';
import { WorkflowStatus, TaskStatus } from '@/constants/workflow';

const POLL_INTERVAL = 1600;

export function useWorkflow() {
  const [workflow,        setWorkflow]       = useState(null);
  const [healingEvents,   setHealingEvents]  = useState([]);
  const [selectedTaskId,  setSelectedTaskId] = useState(null);
  const [loading,         setLoading]        = useState(false);
  const [error,           setError]          = useState(null);
  const pollRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const updateTask = useCallback((taskId, patch) => {
    setWorkflow(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, ...patch } : t),
      };
    });
  }, []);

  const handleSSEEvent = useCallback((type, data) => {
    switch (type) {
      case 'planning':
        setWorkflow(prev => prev ? { ...prev, status: WorkflowStatus.RUNNING } : prev);
        break;
      case 'task_start':
        updateTask(data.taskId, { status: TaskStatus.RUNNING });
        setSelectedTaskId(data.taskId);
        break;
      case 'task_complete':
        updateTask(data.taskId, {
          status: TaskStatus.COMPLETED,
          output: data.output,
          healed: data.healed || false,
        });
        break;
      case 'task_fail':
        updateTask(data.taskId, { status: TaskStatus.FAILED, error: data.error });
        break;
      case 'heal_start':
        setHealingEvents(prev => [...prev, {
          type: 'heal_start',
          taskId: data.taskId,
          retryCount: data.retryCount,
          maxRetries: data.maxRetries,
          errorMessage: data.errorMessage,
          phase: data.phase,
          timestamp: new Date(),
        }]);
        updateTask(data.taskId, { healing: true, healRetry: data.retryCount });
        break;
      case 'heal_success':
        setHealingEvents(prev => [...prev, {
          type: 'heal_success',
          taskId: data.taskId,
          retryCount: data.retryCount,
          timestamp: new Date(),
        }]);
        updateTask(data.taskId, { healing: false, healed: true });
        break;
      case 'heal_fail':
        setHealingEvents(prev => [...prev, {
          type: 'heal_fail',
          taskId: data.taskId,
          reason: data.reason,
          timestamp: new Date(),
        }]);
        updateTask(data.taskId, { healing: false });
        break;
      case 'workflow_complete':
        setWorkflow(prev => prev ? { ...prev, status: WorkflowStatus.COMPLETED, outputs: data.outputs } : prev);
        break;
      case 'workflow_fail':
        setWorkflow(prev => prev ? { ...prev, status: WorkflowStatus.FAILED } : prev);
        break;
      default:
        break;
    }
  }, [updateTask]);

  const pollOnceMock = useCallback(async (workflowId) => {
    try {
      agentService.advanceMock();
      const wf = await agentService.getWorkflow(workflowId);
      setWorkflow(wf);
      if (wf.status === WorkflowStatus.COMPLETED || wf.status === WorkflowStatus.FAILED) {
        stopPolling();
        setLoading(false);
      }
    } catch (err) {
      setError(err.message);
      stopPolling();
      setLoading(false);
    }
  }, [stopPolling]);

  const startWorkflow = useCallback(async (goal, projectId, initialTasks = null) => {
    setLoading(true);
    setError(null);
    setWorkflow(null);
    setSelectedTaskId(null);
    setHealingEvents([]);
    stopPolling();

    try {
      if (USE_MOCK) {
        const { workflowId, workflow: initialWf } = await agentService.startWorkflow(goal, projectId);
        setWorkflow(initialWf);
        pollRef.current = setInterval(() => pollOnceMock(workflowId), POLL_INTERVAL);
      } else {
        const skeletonWorkflow = initialTasks && initialTasks.length > 0
          ? {
              id: `wf-${projectId}`,
              goal,
              status: WorkflowStatus.RUNNING,
              tasks: initialTasks.map((t, i) => ({
                id: t.id || `task-${i+1}`,
                type: t.type || 'TEXT_GENERATION',
                title: t.title || `Task ${i+1}`,
                description: t.description || '',
                status: TaskStatus.PENDING,
                output: null,
                healed: false,
              })),
            }
          : null;
        setWorkflow(skeletonWorkflow);

        await startWorkflowStream(projectId, (type, data) => {
          if (type === 'task_start') {
            setWorkflow(prev => {
              if (!prev) {
                return {
                  id: `wf-${projectId}`,
                  goal,
                  status: WorkflowStatus.RUNNING,
                  tasks: [{
                    id: data.taskId, type: data.type, title: data.title,
                    description: data.description || '', status: TaskStatus.RUNNING,
                    output: null, healed: false,
                  }],
                };
              }
              const exists = prev.tasks.some(t => t.id === data.taskId);
              if (!exists) {
                return {
                  ...prev,
                  status: WorkflowStatus.RUNNING,
                  tasks: [...prev.tasks, {
                    id: data.taskId, type: data.type, title: data.title,
                    description: data.description || '', status: TaskStatus.RUNNING,
                    output: null, healed: false,
                  }],
                };
              }
              return prev;
            });
          }
          handleSSEEvent(type, data);
        });

        setLoading(false);
      }
    } catch (err) {
      setError(
        err.status === 401 ? 'Session expired -- please log in again.' :
        err.status === 403 ? 'You do not have permission to run this project.' :
        err.status === 404 ? 'Project not found.' :
        err.message || 'Failed to start workflow. Please try again.'
      );
      setWorkflow(prev => prev ? { ...prev, status: WorkflowStatus.FAILED } : prev);
      setLoading(false);
    }
  }, [stopPolling, pollOnceMock, handleSSEEvent]);

  const cancelWorkflow = useCallback(async () => {
    if (!workflow) return;
    stopPolling();
    try {
      await agentService.cancelWorkflow(workflow.id);
      setWorkflow(wf => wf ? { ...wf, status: WorkflowStatus.FAILED } : wf);
    } catch (err) {
      console.error('[useWorkflow] cancel error:', err);
    }
  }, [workflow, stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const tasks        = workflow?.tasks ?? [];
  const selectedTask = tasks.find(t => t.id === selectedTaskId) ?? null;
  const isRunning    = workflow?.status === WorkflowStatus.RUNNING || (loading && !error);
  const isComplete   = workflow?.status === WorkflowStatus.COMPLETED;
  const isFailed     = workflow?.status === WorkflowStatus.FAILED;
  const isHealing    = healingEvents.length > 0 && healingEvents[healingEvents.length - 1]?.type === 'heal_start';

  return {
    workflow, tasks, isRunning, isComplete, isFailed, isHealing,
    selectedTask, selectTask: setSelectedTaskId,
    startWorkflow, cancelWorkflow,
    healingEvents, loading, error,
  };
}
