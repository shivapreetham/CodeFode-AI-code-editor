import React, { useState } from 'react';
import { 
  FileIcon, 
  FolderIcon, 
  UserIcon, 
  PlayIcon, 
  XIcon,
  FilterIcon,
  RefreshCwIcon
} from 'lucide-react';

export interface NotificationMetadata {
  path?: string;
  language?: string;
  executionStatus?: string;
}

export interface Notification {
  _id?: string;
  type: 'FILE_CREATE' | 'FILE_UPDATE' | 'FILE_DELETE' |'FILE_MOVE' | 'FOLDER_CREATE' |'FOLDER_MOVE' |
        'FOLDER_DELETE' | 'USER_JOIN' | 'USER_LEAVE' | 'CODE_EXECUTE';
  message: string;
  username: string;
  timestamp: Date;
  metadata?: NotificationMetadata;
}

interface ActivityLogProps {
  notifications: Notification[];
  onRefresh: () => void;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ notifications, onRefresh }) => {
  const [filter, setFilter] = useState<string>('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const getIcon = (type: string) => {
    switch (type) {
      case 'FILE_CREATE':
      case 'FILE_UPDATE':
      case 'FILE_DELETE':
        return <FileIcon className="w-4 h-4" />;
      case 'FOLDER_CREATE':
      case 'FOLDER_DELETE':
        return <FolderIcon className="w-4 h-4" />;
      case 'USER_JOIN':
      case 'USER_LEAVE':
        return <UserIcon className="w-4 h-4" />;
      case 'CODE_EXECUTE':
        return <PlayIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'FILE_CREATE':
      case 'FOLDER_CREATE':
        return 'text-green-500';
      case 'FILE_DELETE':
      case 'FOLDER_DELETE':
        return 'text-red-500';
      case 'FILE_UPDATE':
        return 'text-blue-500';
      case 'USER_JOIN':
        return 'text-purple-500';
      case 'USER_LEAVE':
        return 'text-orange-500';
      case 'CODE_EXECUTE':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const filteredNotifications = notifications.filter(notification => 
    filter === 'ALL' ? true : notification.type.startsWith(filter)
  );

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
            {['ALL', 'FILE', 'FOLDER', 'USER', 'CODE'].map(filterType => (
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
        {filteredNotifications.length > 0 ? (
          <>
            {filteredNotifications.map((notification) => (
              <div 
                key={notification._id} 
                className="card bg-base-200 shadow-sm hover:bg-base-300 transition-colors"
              >
                <div className="card-body p-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${getColor(notification.type)}`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{notification.message}</p>
                      <div className="flex gap-2 mt-1 text-xs opacity-70">
                        <span>by {notification.username}</span>
                        <span>•</span>
                        <span>{new Date(notification.timestamp).toLocaleString()}</span>
                      </div>
                      {notification.metadata?.path && (
                        <p className="mt-1 text-xs opacity-70">
                          Path: {notification.metadata.path}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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