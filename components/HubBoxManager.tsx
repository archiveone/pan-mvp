import React, { useState } from 'react';
import { X, Plus, Copy, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react';
import { AdvancedHubService, HubBox, BOX_TYPES } from '@/services/advancedHubService';
import * as Icons from 'lucide-react';

interface HubBoxManagerProps {
  isOpen: boolean;
  onClose: () => void;
  boxes: HubBox[];
  onUpdate: () => void;
  userId: string;
}

const HubBoxManager: React.FC<HubBoxManagerProps> = ({
  isOpen,
  onClose,
  boxes,
  onUpdate,
  userId
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedBoxType, setSelectedBoxType] = useState<string | null>(null);
  const [newInstanceName, setNewInstanceName] = useState('');

  if (!isOpen) return null;

  const handleAddBox = async (boxType: string) => {
    const boxConfig = BOX_TYPES.find(b => b.value === boxType);
    if (!boxConfig) return;

    // Check if multiple instances allowed
    const existing = boxes.filter(b => b.box_type === boxType);
    const instanceName = existing.length > 0 
      ? newInstanceName || `${boxConfig.label} ${existing.length + 1}`
      : undefined;

    setLoading(true);
    try {
      const result = await AdvancedHubService.createHubBox(userId, {
        title: instanceName || boxConfig.label,
        box_type: boxType,
        instance_name: instanceName,
        icon: boxConfig.icon,
        color: ['blue', 'indigo', 'pink', 'purple', 'green'][Math.floor(Math.random() * 5)]
      });

      if (result.success) {
        onUpdate();
        setSelectedBoxType(null);
        setNewInstanceName('');
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert('Failed to add box');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (box: HubBox) => {
    const newName = prompt(`Name for duplicate of "${box.title}":`, `${box.title} Copy`);
    if (!newName) return;

    setLoading(true);
    try {
      const result = await AdvancedHubService.duplicateBox(box.id, newName);
      if (result.success) {
        onUpdate();
      } else {
        alert(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (box: HubBox) => {
    if (!confirm(`Delete "${box.title}"? This cannot be undone.`)) return;

    setLoading(true);
    try {
      const result = await AdvancedHubService.deleteHubBox(box.id);
      if (result.success) {
        onUpdate();
      } else {
        alert(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (box: HubBox) => {
    setLoading(true);
    try {
      await AdvancedHubService.toggleBoxVisibility(box.id, !box.is_active);
      onUpdate();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Manage Hub Boxes
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Add, remove, and reorder your hub boxes
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Boxes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Your Boxes ({boxes.length})
              </h3>
              <div className="space-y-2">
                {boxes.map((box, index) => {
                  const IconComp = (Icons as any)[box.icon] || Icons.Folder;
                  return (
                    <div
                      key={box.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl group"
                    >
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${FOLDER_COLORS[box.color]?.from || 'from-blue-500'} ${FOLDER_COLORS[box.color]?.to || 'to-cyan-500'}`}>
                        <IconComp className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {box.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {box.box_type} {box.instance_name && `(${box.instance_name})`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDuplicate(box)}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(box)}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add New Box */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Add New Box
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {BOX_TYPES.map((boxType) => {
                  const IconComp = (Icons as any)[boxType.icon] || Icons.Folder;
                  const existing = boxes.filter(b => b.box_type === boxType.value).length;
                  
                  return (
                    <button
                      key={boxType.value}
                      onClick={() => {
                        if (boxType.allowMultiple && existing > 0) {
                          setSelectedBoxType(boxType.value);
                        } else {
                          handleAddBox(boxType.value);
                        }
                      }}
                      disabled={loading}
                      className="p-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all text-left disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <IconComp className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {boxType.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {boxType.description}
                      </p>
                      {existing > 0 && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          {existing} existing
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Instance Name Input */}
              {selectedBoxType && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Name for new instance:
                  </label>
                  <input
                    type="text"
                    value={newInstanceName}
                    onChange={(e) => setNewInstanceName(e.target.value)}
                    placeholder={`e.g., Work ${BOX_TYPES.find(b => b.value === selectedBoxType)?.label}`}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg mb-3"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedBoxType(null);
                        setNewInstanceName('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAddBox(selectedBoxType)}
                      disabled={loading || !newInstanceName.trim()}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Add
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// Import helper
import { FOLDER_COLORS } from '@/services/foldersService';

export default HubBoxManager;

