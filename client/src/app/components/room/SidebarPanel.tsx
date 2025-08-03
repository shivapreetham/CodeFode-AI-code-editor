import React from 'react';
import FileExplorer from "@/app/components/fileExplorer/FileExplorer";
import Peoples from "@/app/components/Peoples";
import Chat from "@/app/components/chat/Chat";
import ThemeSwitcher from "@/app/components/ui/theme/ThemeComp";
import AiSuggestionSidebar from "@/app/components/aiSidebar/AiSidebar";
import ActivityLog from "@/app/components/activityLog/activityLog";
import { IFile } from "@/interfaces/IFile";
import { IFileExplorerNode } from "@/interfaces/IFileExplorerNode";
import { Notification } from "@/interfaces/Notifications";
import { Dispatch, SetStateAction } from "react";

interface SidebarPanelProps {
  activeTab: number;
  isCollapsed: boolean;
  roomId: string;
  username: string | null;
  clients: any[];
  notifications: Notification[];
  onRefreshNotifications: () => Promise<void>;
  // File explorer props
  fileExplorerData: IFileExplorerNode;
  setFileExplorerData: Dispatch<SetStateAction<IFileExplorerNode>>;
  activeFile: IFile;
  setActiveFile: Dispatch<SetStateAction<IFile>>;
  files: IFile[];
  setFiles: Dispatch<SetStateAction<IFile[]>>;
  isFileExplorerUpdated: boolean;
  setIsFileExplorerUpdated: Dispatch<SetStateAction<boolean>>;
  filesContentMap: Map<string, IFile>;
  setNotifications: Dispatch<SetStateAction<Notification[]>>;
  socket: any;
  // AI props
  aiResponse: any;
  aiLoading: boolean;
  aiError: string | null;
  onManualAITrigger?: () => void;
  isDebouncing?: boolean;
}

const SidebarPanel: React.FC<SidebarPanelProps> = ({
  activeTab,
  isCollapsed,
  roomId,
  username,
  clients,
  notifications,
  onRefreshNotifications,
  fileExplorerData,
  setFileExplorerData,
  activeFile,
  setActiveFile,
  files,
  setFiles,
  isFileExplorerUpdated,
  setIsFileExplorerUpdated,
  filesContentMap,
  setNotifications,
  socket,
  aiResponse,
  aiLoading,
  aiError,
  onManualAITrigger,
  isDebouncing
}) => {
  console.log('🏷 SidebarPanel render:', { activeTab, isCollapsed });
  
  if (isCollapsed) return null;

  return (
    <div className="w-full md:w-[30%] lg:w-[30%] md:h-screen bg-[#2d2a2a] border-r border-r-[#605c5c]">
      {activeTab === 0 && (
        <FileExplorer
          fileExplorerData={fileExplorerData}
          setFileExplorerData={setFileExplorerData}
          activeFile={activeFile}
          setActiveFile={setActiveFile}
          files={files}
          setFiles={setFiles}
          isFileExplorerUpdated={isFileExplorerUpdated}
          setIsFileExplorerUpdated={setIsFileExplorerUpdated}
          roomId={roomId}
          filesContentMap={filesContentMap}
          notifications={notifications}
          setNotifications={setNotifications}
          socket={socket}
          username={username}
        />
      )}
      {activeTab === 1 && (
        <Peoples clients={clients} roomId={roomId} />
      )}
      {activeTab === 2 && username && roomId && (
        <Chat
          socket={socket?.current}
          username={username}
          roomId={roomId}
        />
      )}
      {activeTab === 3 && <ThemeSwitcher />}
      {activeTab === 4 && (
        <AiSuggestionSidebar
          isOpen={true}
          aiResponse={aiResponse}
          isLoading={aiLoading}
          error={aiError}
          onManualTrigger={onManualAITrigger}
          isDebouncing={isDebouncing}
        />
      )}
      {activeTab === 5 && (
        <ActivityLog
          notifications={notifications}
          onRefresh={onRefreshNotifications}
        />
      )}
    </div>
  );
};

export default SidebarPanel; 