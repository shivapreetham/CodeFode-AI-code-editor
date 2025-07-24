// import { useEffect, useState } from "react";
// import { Socket } from "socket.io-client";
// import { ACTIONS } from "@/app/helpers/Actions";
// import { Notification } from "@/interfaces/Notifications";
// import { getNotifications } from "@/services/notificationApi";

// interface UseNotificationsProps {
//   roomId: string;
//   socket: Socket | null;
//   user: any;
// }

// export const useNotifications = ({ roomId, socket, user }: UseNotificationsProps) => {
//   const [notifications, setNotifications] = useState<Notification[]>([]);

//   useEffect(() => {
//     if (!roomId || !user) return;

//     const loadNotifications = async () => {
//       try {
//         const notifs = await getNotifications(roomId, {
//           userId: user.id,
//           email: user.email,
//         });
//         setNotifications(notifs);
//       } catch (error) {
//         console.error("Error loading notifications:", error);
//       }
//     };

//     loadNotifications();
//   }, [roomId, user]);

//   useEffect(() => {
//     if (!socket) return;

//     socket.on(ACTIONS.NOTIFICATION_ADDED, ({ notification }) => {
//       setNotifications(prev => [notification, ...prev]);
//     });

//     return () => {
//       socket.off(ACTIONS.NOTIFICATION_ADDED);
//     };
//   }, [socket]);

//   return { notifications };
// };

