import React, { useState } from 'react';
import { Check, Pipette } from 'lucide-react';
import { FOLDER_COLORS } from '@/services/foldersService';

interface ColorPickerProps {
  selectedColor: string;
  selectedCustomColor?: string;
  colorType: 'preset' | 'custom';
  onColorChange: (color: string, customColor?: string, colorType?: 'preset' | 'custom') => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  selectedCustomColor,
  colorType,
  onColorChange
}) => {
  const [showCustomPicker, setShowCustomPicker] = useState(colorType === 'custom');
  const [customHex, setCustomHex] = useState(selectedCustomColor || '#3B82F6');

  const handlePresetColorClick = (colorKey: string) => {
    setShowCustomPicker(false);
    onColorChange(colorKey, undefined, 'preset');
  };

  const handleCustomColorChange = (hex: string) => {
    setCustomHex(hex);
    onColorChange('custom', hex, 'custom');
  };

  return (
    <div className="space-y-4">
      {/* Preset Colors */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Preset Colors
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {Object.entries(FOLDER_COLORS).map(([key, value]) => (
            <button
              key={key}
              onClick={() => handlePresetColorClick(key)}
              className={`group relative p-4 bg-gradient-to-br ${value.from} ${value.to} rounded-xl hover:scale-105 active:scale-95 transition-all duration-200 ${
                !showCustomPicker && selectedColor === key ? 'ring-4 ring-offset-2 ring-blue-500 dark:ring-offset-gray-800' : ''
              }`}
            >
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 rounded-xl transition-colors" />
              <div className="relative flex flex-col items-center gap-1">
                {!showCustomPicker && selectedColor === key && (
                  <Check className="w-5 h-5 text-white" />
                )}
                <span className="text-white text-xs font-medium text-center">{value.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Color Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Custom Color
        </label>
        
        {!showCustomPicker ? (
          <button
            onClick={() => {
              setShowCustomPicker(true);
              handleCustomColorChange(customHex);
            }}
            className="w-full p-4 bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 transition-all flex items-center justify-center gap-3 group"
          >
            <Pipette className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            <span className="text-gray-700 dark:text-gray-300 font-medium">Pick Custom Color</span>
          </button>
        ) : (
          <div className="space-y-4">
            {/* Color Input */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="color"
                  value={customHex}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className="w-full h-16 rounded-xl border-2 border-gray-300 dark:border-gray-600 cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: customHex }}
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={customHex}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^#[0-9A-F]{0,6}$/i.test(value)) {
                      handleCustomColorChange(value);
                    }
                  }}
                  placeholder="#3B82F6"
                  maxLength={7}
                  className="w-full h-16 px-4 bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-lg font-mono text-center text-gray-900 dark:text-white uppercase focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Quick Colors */}
            <div className="grid grid-cols-8 gap-2">
              {[
                '#EF4444', // Red
                '#F97316', // Orange
                '#F59E0B', // Amber
                '#EAB308', // Yellow
                '#84CC16', // Lime
                '#22C55E', // Green
                '#10B981', // Emerald
                '#14B8A6', // Teal
                '#06B6D4', // Cyan
                '#0EA5E9', // Sky
                '#3B82F6', // Blue
                '#6366F1', // Indigo
                '#8B5CF6', // Violet
                '#A855F7', // Purple
                '#D946EF', // Fuchsia
                '#EC4899', // Pink
              ].map((color) => (
                <button
                  key={color}
                  onClick={() => handleCustomColorChange(color)}
                  className={`w-full aspect-square rounded-lg transition-all hover:scale-110 active:scale-95 ${
                    customHex.toUpperCase() === color ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-800' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            {/* Back to Presets */}
            <button
              onClick={() => {
                setShowCustomPicker(false);
                handlePresetColorClick(selectedColor || 'blue');
              }}
              className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              ← Back to preset colors
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorPicker;

