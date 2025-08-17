export type NotificationType = 
  | 'FILE_CREATE' 
  | 'FILE_UPDATE' 
  | 'FILE_DELETE' 
  | 'FOLDER_MOVE'
  | 'FILE_MOVE'
  | 'FOLDER_CREATE' 
  | 'FOLDER_DELETE' 
  | 'USER_JOIN' 
  | 'USER_LEAVE' 
  | 'CODE_EXECUTE'
  | 'FILE_OPEN'
  | 'FILE_EDIT_START'
  | 'FILE_EDIT_END'
  | 'WHITEBOARD_DRAW'
  | 'WHITEBOARD_TEXT'
  | 'WHITEBOARD_CLEAR';

export interface NotificationMetadata {
  path?: string;
  language?: string;
  executionStatus?: string;
  action?: string; // open, edit_start, edit_end, draw, text, clear
  duration?: number; // for edit sessions in milliseconds
  coordinates?: { x: number; y: number }; // for whiteboard actions
}

export interface Notification {
  _id?: string;
  type: NotificationType;
  message: string;
  username: string;
  timestamp: Date;
  metadata?: NotificationMetadata;
}