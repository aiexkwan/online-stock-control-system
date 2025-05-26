'use client';

import React, { useState, ReactNode } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface AccordionItemProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  disabled?: boolean;
  badge?: string | number;
  icon?: ReactNode;
  className?: string;
}

interface AccordionProps {
  children: ReactNode;
  allowMultiple?: boolean;
  className?: string;
}

interface AccordionContextType {
  openItems: Set<string>;
  toggleItem: (id: string) => void;
  allowMultiple: boolean;
}

const AccordionContext = React.createContext<AccordionContextType | null>(null);

export const Accordion: React.FC<AccordionProps> = React.memo(({
  children,
  allowMultiple = false,
  className = ''
}) => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        if (!allowMultiple) {
          newSet.clear();
        }
        newSet.add(id);
      }
      
      return newSet;
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, allowMultiple }}>
      <div className={`space-y-2 ${className}`}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
});

export const AccordionItem: React.FC<AccordionItemProps> = React.memo(({
  title,
  subtitle,
  children,
  defaultOpen = false,
  disabled = false,
  badge,
  icon,
  className = ''
}) => {
  const context = React.useContext(AccordionContext);
  const [itemId] = useState(() => Math.random().toString(36).substr(2, 9));
  
  // Initialize default open state
  React.useEffect(() => {
    if (defaultOpen && context && !context.openItems.has(itemId)) {
      context.toggleItem(itemId);
    }
  }, [defaultOpen, itemId, context]);

  if (!context) {
    throw new Error('AccordionItem must be used within an Accordion');
  }

  const isOpen = context.openItems.has(itemId);

  const handleToggle = () => {
    if (!disabled) {
      context.toggleItem(itemId);
    }
  };

  return (
    <div className={`
      border border-gray-700 rounded-lg overflow-hidden
      ${disabled ? 'opacity-50' : ''}
      ${className}
    `}>
      {/* Header */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          w-full px-4 py-3 text-left flex items-center justify-between
          bg-gray-800 hover:bg-gray-750 transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {icon && (
            <div className="flex-shrink-0 text-gray-400">
              {icon}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-white font-medium truncate">
                {title}
              </h3>
              {badge && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-gray-400 truncate mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 ml-3">
          {isOpen ? (
            <ChevronDownIcon className="h-5 w-5 text-gray-400 transition-transform duration-200" />
          ) : (
            <ChevronRightIcon className="h-5 w-5 text-gray-400 transition-transform duration-200" />
          )}
        </div>
      </button>

      {/* Content */}
      <div className={`
        overflow-hidden transition-all duration-300 ease-in-out
        ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
      `}>
        <div className="px-4 py-4 bg-gray-850 border-t border-gray-700">
          {children}
        </div>
      </div>
    </div>
  );
});

export const AccordionGroup: React.FC<{
  title: string;
  children: ReactNode;
  className?: string;
}> = React.memo(({
  title,
  children,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
        {title}
      </h2>
      <Accordion allowMultiple>
        {children}
      </Accordion>
    </div>
  );
});

// Utility hook for controlling accordion state externally
export const useAccordionControl = () => {
  const [controlledItems, setControlledItems] = useState<Set<string>>(new Set());

  const openItem = (id: string) => {
    setControlledItems(prev => new Set(prev).add(id));
  };

  const closeItem = (id: string) => {
    setControlledItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const toggleItem = (id: string) => {
    setControlledItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const openAll = (ids: string[]) => {
    setControlledItems(new Set(ids));
  };

  const closeAll = () => {
    setControlledItems(new Set());
  };

  return {
    controlledItems,
    openItem,
    closeItem,
    toggleItem,
    openAll,
    closeAll
  };
};

Accordion.displayName = 'Accordion';
AccordionItem.displayName = 'AccordionItem';
AccordionGroup.displayName = 'AccordionGroup';

export default Accordion; 