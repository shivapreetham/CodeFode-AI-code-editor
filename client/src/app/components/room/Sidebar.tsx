import React from 'react';
import SourceIcon from "@mui/icons-material/Source";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import ChatIcon from "@mui/icons-material/Chat";
import SettingsIcon from "@mui/icons-material/Settings";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import NotificationsIcon from '@mui/icons-material/Notifications';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

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
    { id: 0, icon: SourceIcon, label: "Files" },
    { id: 1, icon: PeopleAltIcon, label: "Users" },
    { id: 2, icon: ChatIcon, label: "Chat" },
    { id: 3, icon: SettingsIcon, label: "Settings" },
    { id: 4, icon: AutoFixHighIcon, label: "AI" },
    { id: 5, icon: NotificationsIcon, label: "Notifications" },
  ];

  return (
    <div className="hidden md:w-[4.5%] md:h-screen bg-[#2d2a2a] border-r border-r-[#4e4b4b] py-5 md:flex flex-col items-center gap-3">
      {tabs.map(({ id, icon: Icon, label }) => (
        <div
          key={id}
          onClick={() => onTabChange(id)}
          className={`cursor-pointer p-2 rounded transition-all duration-200 ${
            activeTab === id 
              ? "text-green-500 bg-green-500/10" 
              : "text-gray-400 hover:text-green-500 hover:bg-green-500/5"
          }`}
          title={label}
        >
          <Icon sx={{ fontSize: "2rem" }} />
        </div>
      ))}
      
      <button 
        onClick={onToggleCollapse} 
        className="text-gray-400 hover:text-green-500 p-2 rounded transition-all duration-200"
      >
        {isCollapsed ? (
          <ArrowBackIcon sx={{ fontSize: "2rem" }} />
        ) : (
          <ArrowForwardIcon sx={{ fontSize: "2rem" }} />
        )}
      </button>
    </div>
  );
};

export default Sidebar; 