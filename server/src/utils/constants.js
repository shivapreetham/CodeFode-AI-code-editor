// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

// Socket Events
export const SOCKET_EVENTS = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  
  // Code collaboration events
  CODE_CHANGE: 'code-change',
  CURSOR_POSITION: 'cursor-position',
  FILE_CHANGE: 'file-change',
  FILE_TREE_UPDATE: 'file-tree-update',
  
  // Chat events
  CHAT_MESSAGE: 'chat-message',
  TYPING_START: 'typing-start',
  TYPING_STOP: 'typing-stop',
  
  // Whiteboard events
  WHITEBOARD_UPDATE: 'whiteboard-update',
  DRAWING_DATA: 'drawing-data',
  
  // User events
  USER_JOIN: 'user-join',
  USER_LEAVE: 'user-leave',
  USER_LIST: 'user-list',
  
  // System events
  ERROR: 'error',
  NOTIFICATION: 'notification',
  ROOM_STATE: 'room-state'
};

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  RATE_LIMIT: 'Too many requests',
  INVALID_INPUT: 'Invalid input provided',
  DATABASE_ERROR: 'Database operation failed',
  NETWORK_ERROR: 'Network error occurred',
  AI_SERVICE_ERROR: 'AI service unavailable',
  FILE_TOO_LARGE: 'File size too large',
  UNSUPPORTED_FORMAT: 'Unsupported file format'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  OPERATION_SUCCESS: 'Operation completed successfully'
};

// File Types and Extensions
export const SUPPORTED_LANGUAGES = {
  javascript: { extensions: ['.js', '.jsx'], mode: 'javascript' },
  typescript: { extensions: ['.ts', '.tsx'], mode: 'typescript' },
  python: { extensions: ['.py'], mode: 'python' },
  java: { extensions: ['.java'], mode: 'java' },
  cpp: { extensions: ['.cpp', '.cxx', '.cc'], mode: 'cpp' },
  c: { extensions: ['.c'], mode: 'c' },
  html: { extensions: ['.html', '.htm'], mode: 'html' },
  css: { extensions: ['.css'], mode: 'css' },
  json: { extensions: ['.json'], mode: 'json' },
  xml: { extensions: ['.xml'], mode: 'xml' },
  markdown: { extensions: ['.md', '.markdown'], mode: 'markdown' },
  yaml: { extensions: ['.yml', '.yaml'], mode: 'yaml' },
  sql: { extensions: ['.sql'], mode: 'sql' },
  go: { extensions: ['.go'], mode: 'go' },
  rust: { extensions: ['.rs'], mode: 'rust' },
  php: { extensions: ['.php'], mode: 'php' },
  ruby: { extensions: ['.rb'], mode: 'ruby' },
  swift: { extensions: ['.swift'], mode: 'swift' },
  kotlin: { extensions: ['.kt'], mode: 'kotlin' }
};

// Rate Limiting
export const RATE_LIMITS = {
  DEFAULT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // requests
  },
  STRICT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20 // requests
  },
  CODE_EXECUTION: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10 // requests
  },
  AI_REQUESTS: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30 // requests
  }
};

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  SHORT: 5 * 60, // 5 minutes
  MEDIUM: 30 * 60, // 30 minutes
  LONG: 24 * 60 * 60, // 24 hours
  WORKSPACE: 10 * 60, // 10 minutes for workspace data
  AI_RESPONSE: 5 * 60 // 5 minutes for AI responses
};

// Validation Limits
export const LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_CODE_LENGTH: 100000, // 100k characters
  MAX_MESSAGE_LENGTH: 1000,
  MAX_ROOM_ID_LENGTH: 100,
  MAX_USERNAME_LENGTH: 50,
  MAX_FILENAME_LENGTH: 255,
  MAX_ACTIVE_CONNECTIONS: 100,
  MAX_ROOMS_PER_USER: 10
};

// Environment Constants
export const NODE_ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test'
};