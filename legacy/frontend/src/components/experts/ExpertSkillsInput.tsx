import React from 'react';
import Select from 'react-select';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ExpertSkillsInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  suggestions?: string[];
}

export function ExpertSkillsInput({ skills, onChange, suggestions = [] }: ExpertSkillsInputProps) {
  const [inputValue, setInputValue] = React.useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue) {
      e.preventDefault();
      if (!skills.includes(inputValue)) {
        onChange([...skills, inputValue]);
      }
      setInputValue('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    onChange(skills.filter(skill => skill !== skillToRemove));
  };

  const options = suggestions.map(skill => ({
    value: skill,
    label: skill
  }));

  return (
    <div className="space-y-4">
      <Select
        isMulti
        options={options}
        value={skills.map(skill => ({ value: skill, label: skill }))}
        onChange={(selected) => {
          onChange(selected ? selected.map(option => option.value) : []);
        }}
        placeholder="Select or type skills..."
        className="react-select-container"
        classNamePrefix="react-select"
        styles={{
          control: (base) => ({
            ...base,
            borderColor: '#e5e7eb',
            '&:hover': {
              borderColor: '#3b82f6'
            }
          }),
          multiValue: (base) => ({
            ...base,
            backgroundColor: '#eff6ff',
            borderRadius: '0.375rem'
          }),
          multiValueLabel: (base) => ({
            ...base,
            color: '#1d4ed8'
          }),
          multiValueRemove: (base) => ({
            ...base,
            color: '#1d4ed8',
            '&:hover': {
              backgroundColor: '#dbeafe',
              color: '#1e40af'
            }
          })
        }}
      />

      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <motion.span
            key={skill}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
          >
            {skill}
            <button
              onClick={() => handleRemoveSkill(skill)}
              className="ml-2 text-blue-500 hover:text-blue-700"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.span>
        ))}
      </div>

      {suggestions.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Suggested skills:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions
              .filter(suggestion => !skills.includes(suggestion))
              .map((suggestion) => (
                <motion.button
                  key={suggestion}
                  onClick={() => onChange([...skills, suggestion])}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  + {suggestion}
                </motion.button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}