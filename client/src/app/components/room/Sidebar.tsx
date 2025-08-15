import React, { useCallback } from 'react';
import SourceIcon from "@mui/icons-material/Source";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import ChatIcon from "@mui/icons-material/Chat";
import SettingsIcon from "@mui/icons-material/Settings";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

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
    { id: 0, icon: SourceIcon, label: "Files", ariaLabel: "File Explorer" },
    { id: 1, icon: PeopleAltIcon, label: "Users", ariaLabel: "Connected Users" },
    { id: 2, icon: ChatIcon, label: "Chat", ariaLabel: "Team Chat" },
    { id: 3, icon: SettingsIcon, label: "Settings", ariaLabel: "Room Settings" },
    { id: 4, icon: AutoFixHighIcon, label: "AI", ariaLabel: "AI Assistant" },
    { id: 5, icon: NotificationsIcon, label: "Notifications", ariaLabel: "Activity Notifications" },
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
    <nav 
      className="hidden md:w-[4.5%] md:h-screen bg-surface-dark dark:bg-surface-darker border-r border-secondary-300 dark:border-secondary-700 py-5 md:flex flex-col items-center gap-3 transition-colors duration-200"
      role="navigation" 
      aria-label="Main sidebar navigation"
    >
      {tabs.map(({ id, icon: Icon, label, ariaLabel }) => (
        <button
          key={id}
          onClick={() => handleTabChange(id)}
          className={`group relative cursor-pointer p-3 rounded-lg transition-all duration-200 hover:scale-105 focus:scale-105 ${
            activeTab === id 
              ? "text-primary-500 bg-primary-100 dark:bg-primary-900 shadow-glow" 
              : "text-secondary-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950"
          }`}
          title={label}
          aria-label={ariaLabel}
          type="button"
        >
          <Icon sx={{ fontSize: "1.75rem" }} />
          
          {/* Tooltip */}
          <div className="absolute left-full ml-3 px-2 py-1 bg-secondary-900 dark:bg-secondary-100 text-white dark:text-secondary-900 text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {label}
          </div>
        </button>
      ))}
      
      {/* Spacer */}
      <div className="flex-1" />
      
      {/* Collapse Toggle */}
      <button 
        onClick={handleToggleCollapse}
        className="group text-secondary-500 hover:text-primary-500 p-3 rounded-lg transition-all duration-200 hover:scale-105 focus:scale-105 hover:bg-primary-50 dark:hover:bg-primary-950"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        type="button"
      >
        {isCollapsed ? (
          <ChevronRightIcon sx={{ fontSize: "1.75rem" }} />
        ) : (
          <ChevronLeftIcon sx={{ fontSize: "1.75rem" }} />
        )}
        
        {/* Tooltip */}
        <div className="absolute left-full ml-3 px-2 py-1 bg-secondary-900 dark:bg-secondary-100 text-white dark:text-secondary-900 text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          {isCollapsed ? "Expand" : "Collapse"}
        </div>
      </button>
    </nav>
  );
};

export default Sidebar; 