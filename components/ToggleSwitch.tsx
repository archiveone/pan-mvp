import React from 'react';

interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, checked, onChange }) => {
  return (
    <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
      <input 
        type="checkbox" 
        id={id}
        className="sr-only peer" 
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-pan-red/50 transition-colors duration-200 ease-in-out peer-checked:bg-pan-red"></div>
      <div className="absolute top-0.5 left-[2px] bg-white border-gray-300 border rounded-full h-5 w-5 transition-transform duration-200 ease-in-out peer-checked:translate-x-full peer-checked:border-white"></div>
    </label>
  );
};

export default ToggleSwitch;
