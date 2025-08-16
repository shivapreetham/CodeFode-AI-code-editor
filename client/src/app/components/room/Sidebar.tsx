import React, { useCallback } from 'react';
import { 
  Files, 
  Users, 
  MessageSquare, 
  Settings, 
  Sparkles, 
  Bell,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import VSCodeThemeToggle from '../ui/theme/VSCodeThemeToggle';

interface SidebarProps {
  activeTab: number;
  isCollapsed: boolean;
  onTabChange: (tabId: number) => void;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  isCollapsed,
  onTabChange,
  onToggleCollapse
}) => {
  const tabs = [
    { id: 0, icon: Files, label: "Explorer", ariaLabel: "File Explorer" },
    { id: 1, icon: Users, label: "Users", ariaLabel: "Connected Users" },
    { id: 2, icon: MessageSquare, label: "Chat", ariaLabel: "Team Chat" },
    { id: 3, icon: Settings, label: "Settings", ariaLabel: "Room Settings" },
    { id: 4, icon: Sparkles, label: "AI", ariaLabel: "AI Assistant" },
    { id: 5, icon: Bell, label: "Notifications", ariaLabel: "Activity Notifications" },
  ];

  const handleTabChange = useCallback((tabId: number) => {
    try {
      onTabChange(tabId);
    } catch (error) {
      console.error('Error changing tab:', error);
    }
  }, [onTabChange]);

  const handleToggleCollapse = useCallback(() => {
    try {
      onToggleCollapse();
    } catch (error) {
      console.error('Error toggling sidebar:', error);
    }
  }, [onToggleCollapse]);

  return (
    <div className="vscode-activity-bar">
      {tabs.map(({ id, icon: Icon, label, ariaLabel }) => (
        <button
          key={id}
          onClick={() => handleTabChange(id)}
          className={`activity-button ${activeTab === id ? 'active' : ''}`}
          title={label}
          aria-label={ariaLabel}
          type="button"
        >
          <Icon className="w-6 h-6" />
        </button>
      ))}
      
      {/* Spacer */}
      <div className="flex-1" />
      
      {/* Theme Toggle */}
      <VSCodeThemeToggle />
      
      {/* Collapse Toggle */}
      <button 
        onClick={handleToggleCollapse}
        className="activity-button"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        type="button"
      >
        {isCollapsed ? (
          <ChevronRight className="w-6 h-6" />
        ) : (
          <ChevronLeft className="w-6 h-6" />
        )}
      </button>
    </div>
  );
};

export default Sidebar; 