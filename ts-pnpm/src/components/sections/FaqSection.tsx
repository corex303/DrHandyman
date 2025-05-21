'use client';

import React, { useState } from 'react';
import { FaqSectionSettings, FaqItem } from '@/types/appearance';
import { cn } from '@/lib/utils';
import { FaPlus, FaMinus } from 'react-icons/fa'; // Example icons

interface FaqSectionProps {
  settings?: FaqSectionSettings;
}

const defaultSectionSettings: FaqSectionSettings = {
  title: 'FAQs',
  subtitle: 'Find answers to your questions.',
  textAlignment: 'left',
  items: [
    { id: 'faq_def_1', question: 'Default Question 1?', answer: 'Default Answer 1.' },
    { id: 'faq_def_2', question: 'Default Question 2?', answer: 'Default Answer 2.' },
  ],
  layoutStyle: 'accordion',
  openMultiple: false,
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
  questionTextColor: '#111827',
  answerTextColor: '#374151',
  borderColor: '#E5E7EB',
  paddingTop: 'py-12',
  paddingBottom: 'pb-12',
};

const AccordionItem: React.FC<{
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
  settings: FaqSectionSettings;
}> = ({ item, isOpen, onToggle, settings }) => {
  // In a real scenario, you might map settings.iconOpen/Closed to actual icon components
  const Icon = isOpen ? FaMinus : FaPlus;

  return (
    <div 
      className="border-b"
      style={{ borderColor: settings.borderColor }}
    >
      <h2>
        <button
          type="button"
          className="flex w-full items-center justify-between py-5 text-left font-medium"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={`faq-content-${item.id}`}
          style={{ color: settings.questionTextColor }}
        >
          <span>{item.question}</span>
          <Icon className={`h-5 w-5 transform transition-transform duration-200 ${isOpen ? 'rotate-0' : ''}`} />
        </button>
      </h2>
      <div
        id={`faq-content-${item.id}`}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen py-5' : 'max-h-0'}`}
        style={{ color: settings.answerTextColor }}
        role="region"
        aria-labelledby={`faq-question-${item.id}`}
      >
        <p className="whitespace-pre-line">{item.answer}</p>
      </div>
    </div>
  );
};

export const FaqSection: React.FC<FaqSectionProps> = ({ settings: propsSettings }) => {
  const settings = { ...defaultSectionSettings, ...propsSettings };
  const items = settings.items || [];
  const [openItems, setOpenItems] = useState<string[]>([]);

  const handleToggle = (itemId: string) => {
    setOpenItems(prevOpenItems => {
      if (settings.openMultiple) {
        return prevOpenItems.includes(itemId)
          ? prevOpenItems.filter(id => id !== itemId)
          : [...prevOpenItems, itemId];
      } else {
        return prevOpenItems.includes(itemId) ? [] : [itemId];
      }
    });
  };

  const textAlignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  if (settings.layoutStyle === 'list') {
    // Simple list layout (can be expanded)
    return (
      <section
        className={`${settings.paddingTop} ${settings.paddingBottom}`}
        style={{ backgroundColor: settings.backgroundColor }}
      >
        <div className="layout mx-auto px-4">
          {(settings.title || settings.subtitle) && (
            <div className={`mb-12 ${textAlignClasses[settings.textAlignment || 'center']}`}>
              {settings.title && <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl" style={{ color: settings.textColor }}>{settings.title}</h2>}
              {settings.subtitle && <p className="mx-auto max-w-2xl text-lg" style={{ color: settings.textColor ? 'rgba(0,0,0,0.7)' : undefined }}>{settings.subtitle}</p>}
            </div>
          )}
          {items.length > 0 ? (
            <ul className="space-y-4">
              {items.map(item => (
                <li key={item.id} className="rounded-md border p-4" style={{ borderColor: settings.borderColor }}>
                  <h3 className="font-semibold" style={{ color: settings.questionTextColor }}>{item.question}</h3>
                  <p className="mt-1 whitespace-pre-line" style={{ color: settings.answerTextColor }}>{item.answer}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className={`text-center ${textAlignClasses[settings.textAlignment || 'center']}`} style={{ color: settings.textColor }}>
              No FAQs to display yet.
            </p>
          )}
        </div>
      </section>
    );
  }

  // Default to accordion layout
  return (
    <section
      className={`${settings.paddingTop} ${settings.paddingBottom}`}
      style={{ backgroundColor: settings.backgroundColor }}
    >
      <div className="layout mx-auto px-4">
        {(settings.title || settings.subtitle) && (
          <div className={`mb-12 ${textAlignClasses[settings.textAlignment || 'center']}`}>
            {settings.title && (
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl" style={{ color: settings.textColor }}>
                {settings.title}
              </h2>
            )}
            {settings.subtitle && (
              <p className="mx-auto max-w-2xl text-lg" style={{ color: settings.textColor ? 'rgba(0,0,0,0.7)' : undefined }}>
                {settings.subtitle}
              </p>
            )}
          </div>
        )}

        {items.length > 0 ? (
          <div className="mx-auto max-w-3xl">
            {items.map(item => (
              <AccordionItem 
                key={item.id} 
                item={item} 
                isOpen={openItems.includes(item.id)} 
                onToggle={() => handleToggle(item.id)}
                settings={settings}
              />
            ))}
          </div>
        ) : (
          <p className={`text-center ${textAlignClasses[settings.textAlignment || 'center']}`} style={{ color: settings.textColor }}>
            No FAQs to display yet.
          </p>
        )}
      </div>
    </section>
  );
}; 