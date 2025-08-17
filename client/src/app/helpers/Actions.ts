export const ACTIONS = {
    JOIN: 'join',
    JOINED: 'joined',
    DISCONNECTED: 'disconnected',
    CODE_CHANGE: 'code-change',
    SYNC_CODE: 'sync-code',
    LEAVE: 'leave',
    SEND_MESSAGE: "send-message",
    RECEIVE_MESSAGE: "receive-message",
    LOAD_MESSAGES : "load-messages",
    GET_MESSAGES : "get-messages",
    NOTIFICATION_ADDED: 'notification_added',
    NOTIFICATIONS_LOADED: 'notifications_loaded',
    CURSOR_CHANGE : "cursor-change",
    EXECUTE_CODE: "execute-code",
    CODE_RESULT: "code-result",
    
    // File tracking events
    FILE_OPENED: 'file:opened',
    FILE_EDIT_START: 'file:edit_start',
    FILE_EDIT_END: 'file:edit_end',
    
    // Mouse tracking events
    MOUSE_POINTER_MOVE: 'mouse:pointer_move',
    
    // Whiteboard events
    WHITEBOARD_DRAW: 'whiteboard:draw',
    WHITEBOARD_MOUSE_MOVE: 'whiteboard:mouse_move',
    WHITEBOARD_LOAD: 'whiteboard:load',
    WHITEBOARD_CLEAR: 'whiteboard:clear',
    WHITEBOARD_TEXT_ADD: 'whiteboard:text_add',
};

