'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Loader2, XCircle, Upload } from 'lucide-react';

export interface UploadTask {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

interface UploadProgressTrackerProps {
  tasks: UploadTask[];
  onRetry?: (taskId: string) => void;
  onCancel?: (taskId: string) => void;
}

export default function UploadProgressTracker({ 
  tasks, 
  onRetry, 
  onCancel 
}: UploadProgressTrackerProps) {
  const totalProgress = tasks.length > 0
    ? tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length
    : 0;

  const completed = tasks.filter(t => t.status === 'completed').length;
  const failed = tasks.filter(t => t.status === 'failed').length;
  const uploading = tasks.filter(t => t.status === 'uploading').length;

  if (tasks.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-4">
      {/* Overall Progress */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-gray-700">
            Upload Progress
          </span>
          <span className="text-gray-600">
            {completed}/{tasks.length} completed
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300 ease-out"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
        
        {/* Stats */}
        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          {uploading > 0 && <span>⏳ {uploading} uploading</span>}
          {completed > 0 && <span className="text-green-600">✅ {completed} done</span>}
          {failed > 0 && <span className="text-red-600">❌ {failed} failed</span>}
        </div>
      </div>

      {/* Individual Files */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {task.status === 'completed' && (
                <CheckCircle className="text-green-500" size={20} />
              )}
              {task.status === 'uploading' && (
                <Loader2 className="text-blue-500 animate-spin" size={20} />
              )}
              {task.status === 'failed' && (
                <XCircle className="text-red-500" size={20} />
              )}
              {task.status === 'pending' && (
                <Upload className="text-gray-400" size={20} />
              )}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {task.fileName}
              </div>
              <div className="text-xs text-gray-500">
                {(task.fileSize / 1024).toFixed(1)} KB
                {task.status === 'uploading' && ` • ${task.progress}%`}
                {task.status === 'failed' && task.error && (
                  <span className="text-red-500"> • {task.error}</span>
                )}
              </div>
              
              {/* Individual Progress Bar */}
              {task.status === 'uploading' && (
                <div className="w-full h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            {task.status === 'failed' && onRetry && (
              <button
                onClick={() => onRetry(task.id)}
                className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Retry
              </button>
            )}
            
            {task.status === 'uploading' && onCancel && (
              <button
                onClick={() => onCancel(task.id)}
                className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

