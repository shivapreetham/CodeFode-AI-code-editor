import React from 'react';
import FileExplorer from "@/app/components/fileExplorer/FileExplorer";
import Peoples from "@/app/components/Peoples";
import Chat from "@/app/components/chat/Chat";
import ThemeSwitcher from "@/app/components/ui/theme/ThemeComp";
import AiSuggestionSidebar from "@/app/components/aiSidebar/AiSidebar";
import ActivityLog from "@/app/components/activityLog/activityLog";
import Whiteboard from "@/app/components/whiteboard/Whiteboard";
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
  onInsertCode?: (code: string) => void;
  onInsertLineCorrection?: (correction: any) => void;
  isDebouncing?: boolean;
  currentCode?: string;
}

const tabLabels = {
  0: "Explorer",
  1: "Users",
  2: "Chat", 
  3: "Settings",
  4: "AI Assistant",
  5: "Notifications",
  6: "Whiteboard"
};

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
  onInsertCode,
  onInsertLineCorrection,
  isDebouncing,
  currentCode
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="navbar bg-base-200 min-h-14 px-4 border-b border-base-300 flex-shrink-0">
        <div className="navbar-start">
          <h2 className="text-lg font-semibold text-base-content">
            {tabLabels[activeTab as keyof typeof tabLabels] || "Panel"}
          </h2>
        </div>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto bg-base-200">
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
          <div className="p-4">
            <Peoples clients={clients} roomId={roomId} />
          </div>
        )}
        
        {activeTab === 2 && username && roomId && (
          <div className="p-4">
            <Chat
              socket={socket?.current}
              username={username}
              roomId={roomId}
            />
          </div>
        )}
        
        {activeTab === 3 && (
          <div className="p-4">
            <ThemeSwitcher />
          </div>
        )}
        
        {activeTab === 4 && (
          <div className="p-4">
            <AiSuggestionSidebar
              isOpen={true}
              aiResponse={aiResponse}
              isLoading={aiLoading}
              error={aiError}
              onManualTrigger={onManualAITrigger}
              onInsertCode={onInsertCode}
              onInsertLineCorrection={onInsertLineCorrection}
              isDebouncing={isDebouncing}
              currentCode={currentCode}
              currentLanguage={activeFile?.language || 'javascript'}
            />
          </div>
        )}
        
        {activeTab === 5 && (
          <div className="p-4">
            <ActivityLog
              notifications={notifications}
              onRefresh={onRefreshNotifications}
            />
          </div>
        )}
        
        {activeTab === 6 && (
          <div className="h-full">
            <Whiteboard
              roomId={roomId}
              username={username || 'Anonymous'}
              socket={socket?.current}
              isActive={activeTab === 6}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarPanel; 