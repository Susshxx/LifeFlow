import React, { useEffect, useState, useRef } from 'react';
interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}
interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}
export function Tabs({
  tabs,
  activeTab,
  onChange,
  className = ''
}: TabsProps) {
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0
  });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    const activeTabElement = tabRefs.current[activeIndex];
    if (activeTabElement) {
      setIndicatorStyle({
        left: activeTabElement.offsetLeft,
        width: activeTabElement.offsetWidth
      });
    }
  }, [activeTab, tabs]);
  return <div className={`relative ${className}`} role="tablist">
      <div className="flex border-b border-gray-200">
        {tabs.map((tab, index) => <button key={tab.id} ref={el => tabRefs.current[index] = el} role="tab" aria-selected={activeTab === tab.id} aria-controls={`tabpanel-${tab.id}`} tabIndex={activeTab === tab.id ? 0 : -1} disabled={tab.disabled} onClick={() => !tab.disabled && onChange(tab.id)} className={`
              relative px-4 py-3 text-sm font-medium
              transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${activeTab === tab.id ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}
            `}>
            <span className="flex items-center gap-2">
              {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
              {tab.label}
            </span>
          </button>)}
      </div>
      {/* Animated indicator */}
      <div className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300 ease-out" style={{
      left: indicatorStyle.left,
      width: indicatorStyle.width
    }} />
    </div>;
}
interface TabPanelProps {
  id: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}
export function TabPanel({
  id,
  activeTab,
  children,
  className = ''
}: TabPanelProps) {
  if (id !== activeTab) return null;
  return <div id={`tabpanel-${id}`} role="tabpanel" aria-labelledby={id} tabIndex={0} className={`animate-fade-in ${className}`}>
      {children}
    </div>;
}