'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiTrash2, FiEdit, FiEyeOff, FiEye } from 'react-icons/fi';
import { VscGrabber } from "react-icons/vsc";
import { Switch } from '@nextui-org/react';

interface SectionEditorProps {
  title: string;
  type: string;
  isEnabled: boolean;
  onToggle: (isEnabled: boolean) => void;
  onRemove: () => void;
  onEdit?: () => void;
  draggableProvided: any; // From react-beautiful-dnd
  children: React.ReactNode;
}

export default function SectionEditor({
  title,
  type,
  isEnabled,
  onToggle,
  onRemove,
  onEdit,
  draggableProvided,
  children,
}: SectionEditorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      ref={draggableProvided.innerRef}
      {...draggableProvided.draggableProps}
      className={`bg-white border rounded-lg shadow-sm transition-all duration-300 ${isEnabled ? 'border-gray-200' : 'border-dashed border-gray-300 bg-gray-50'}`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-3">
          <div {...draggableProvided.dragHandleProps} className="text-gray-400 hover:text-gray-600">
            <VscGrabber size={20} />
          </div>
          <div>
            <h3 className={`font-semibold ${isEnabled ? 'text-gray-800' : 'text-gray-500'}`}>{title}</h3>
            <span className="text-xs text-gray-400 uppercase tracking-wider">{type}</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Switch
            isSelected={isEnabled}
            onValueChange={onToggle}
            aria-label={`Enable/disable ${title} section`}
            size="sm"
            onClick={(e) => e.stopPropagation()} // Prevent header click-toggle
          />
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <FiChevronDown className="text-gray-500" />
          </motion.div>
        </div>
      </div>

      {/* Body - Collapsible Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-200 p-4">
              <div className="flex justify-end mb-3">
                 {onEdit && (
                  <button onClick={onEdit} className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                    <FiEdit size={14}/>
                    <span>Advanced</span>
                  </button>
                )}
                <button onClick={onRemove} className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-1 ml-4">
                  <FiTrash2 size={14} />
                  <span>Remove</span>
                </button>
              </div>
              {/* Configuration form goes here */}
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 