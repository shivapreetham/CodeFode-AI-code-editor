import React, { useState } from 'react';
import { 
  FileIcon, 
  FolderIcon, 
  UserIcon, 
  PlayIcon, 
  XIcon,
  FilterIcon,
  RefreshCwIcon,
  FolderOpenIcon,
  EditIcon,
  PenTool,
  TypeIcon,
  Trash2Icon
} from 'lucide-react';

import { Notification } from '@/interfaces/Notifications';

interface ActivityLogProps {
  notifications: Notification[];
  onRefresh: () => void;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ notifications, onRefresh }) => {
  const [filter, setFilter] = useState<string>('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Debug logging (only when component first loads)
  if (notifications.length === 0) {
    console.log('🔍 ActivityLog: No notifications loaded yet');
  } else if (notifications.length > 0 && !(window as any).activityLogLoaded) {
    console.log('🔍 ActivityLog: Loaded', notifications.length, 'notifications');
    (window as any).activityLogLoaded = true;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'FILE_CREATE':
      case 'FILE_UPDATE':
      case 'FILE_DELETE':
        return <FileIcon className="w-4 h-4" />;
      case 'FILE_OPEN':
        return <FolderOpenIcon className="w-4 h-4" />;
      case 'FILE_EDIT_START':
      case 'FILE_EDIT_END':
        return <EditIcon className="w-4 h-4" />;
      case 'FOLDER_CREATE':
      case 'FOLDER_DELETE':
        return <FolderIcon className="w-4 h-4" />;
      case 'USER_JOIN':
      case 'USER_LEAVE':
        return <UserIcon className="w-4 h-4" />;
      case 'CODE_EXECUTE':
        return <PlayIcon className="w-4 h-4" />;
      case 'WHITEBOARD_DRAW':
        return <PenTool className="w-4 h-4" />;
      case 'WHITEBOARD_TEXT':
        return <TypeIcon className="w-4 h-4" />;
      case 'WHITEBOARD_CLEAR':
        return <Trash2Icon className="w-4 h-4" />;
      default:
        return <FileIcon className="w-4 h-4" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'FILE_CREATE':
      case 'FOLDER_CREATE':
        return 'text-green-500';
      case 'FILE_DELETE':
      case 'FOLDER_DELETE':
      case 'WHITEBOARD_CLEAR':
        return 'text-red-500';
      case 'FILE_UPDATE':
      case 'FILE_EDIT_START':
      case 'FILE_EDIT_END':
        return 'text-blue-500';
      case 'FILE_OPEN':
        return 'text-cyan-500';
      case 'USER_JOIN':
        return 'text-purple-500';
      case 'USER_LEAVE':
        return 'text-orange-500';
      case 'CODE_EXECUTE':
        return 'text-yellow-500';
      case 'WHITEBOARD_DRAW':
        return 'text-pink-500';
      case 'WHITEBOARD_TEXT':
        return 'text-indigo-500';
      default:
        return 'text-gray-500';
    }
  };

  const filteredNotifications = notifications.filter(notification => 
    filter === 'ALL' ? true : notification.type.startsWith(filter)
  );

  // Remove this debug log as it was causing infinite loops

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Activity Log</h2>
        <div className="join">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="btn btn-ghost btn-sm join-item"
          >
            <FilterIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={onRefresh}
            className="btn btn-ghost btn-sm join-item"
          >
            <RefreshCwIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isFilterOpen && (
        <div className="flex flex-wrap gap-2">
          <div className="join">
            {['ALL', 'FILE', 'FOLDER', 'USER', 'CODE', 'WHITEBOARD'].map(filterType => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`btn btn-sm join-item ${
                  filter === filterType 
                    ? 'btn-primary' 
                    : 'btn-outline'
                }`}
              >
                {filterType}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {/* Debug info */}
        <div className="text-xs opacity-50 p-2 bg-base-300 rounded">
          Debug: {notifications.length} total, {filteredNotifications.length} filtered
        </div>
        
        {filteredNotifications.length > 0 ? (
          <>
            {filteredNotifications.slice(0, 10).map((notification, index) => (
              <div 
                key={notification._id || index} 
                className="bg-base-200 rounded-lg p-3 mb-2"
              >
                <div className="text-sm">
                  <strong>[{notification.type || 'UNKNOWN'}]</strong> {notification.message || 'No message'}
                </div>
                <div className="text-xs opacity-70 mt-1">
                  by {notification.username || 'Unknown'} • {notification.timestamp ? new Date(notification.timestamp).toLocaleString() : 'No timestamp'}
                </div>
              </div>
            ))}
            {filteredNotifications.length > 10 && (
              <div className="text-center text-xs opacity-70 p-2">
                ... and {filteredNotifications.length - 10} more
              </div>
            )}
          </>
        ) : (
          <div className="alert">
            <span>No activities to show</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;