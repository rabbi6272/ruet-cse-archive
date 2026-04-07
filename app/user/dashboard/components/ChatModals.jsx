import { presenceTracker } from "@/lib/PresenceTracker";
import { useP2PChat } from "@/app/components/providers/P2PChatProvider";
// import P2PChat from "./P2PChat";
// import GroupChat from "./GroupChat";
import { notificationSound } from "@/lib/notificationSound";
import { getUserGroup } from "@/lib/group-utils";

export function ChatModals() {
  const { isP2PChatOpen, openP2PChat, closeP2PChat } = useP2PChat();

  const [unsolvedDoubtsCount, setUnsolvedDoubtsCount] = useState(0);
  const [pendingChatRequests, setPendingChatRequests] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [isGroupChatOpen, setIsGroupChatOpen] = useState(false);
  const [groupUnreadCount, setGroupUnreadCount] = useState(0);

  // Previous counts for sound notification tracking
  const [prevPendingChatRequests, setPrevPendingChatRequests] = useState(0);
  const [prevUnreadMessagesCount, setPrevUnreadMessagesCount] = useState(0);
  const [prevGroupUnreadCount, setPrevGroupUnreadCount] = useState(0);
  // // Load pending chat requests count
  // loadPendingChatRequestsCount(userData.roll);
  // // Load unread messages count
  // loadUnreadMessagesCount(userData.roll);
  // // Load group unread count
  // loadGroupUnreadCount(userData.roll);
  // Record daily visit for Nutrinos

  // Load pending chat requests count
  const loadPendingChatRequestsCount = (rollNumber) => {
    try {
      const requestsRef = ref(db, "p2pChatRequests");
      const incomingRequestsQuery = query(
        requestsRef,
        orderByChild("toRoll"),
        equalTo(rollNumber),
      );

      onValue(incomingRequestsQuery, (snapshot) => {
        const data = snapshot.val() || {};
        const pendingCount = Object.keys(data).filter((key) => {
          const request = data[key];
          return request.status === "pending";
        }).length;

        // Play sound notification if count increased (new request received)
        if (
          pendingCount > prevPendingChatRequests &&
          prevPendingChatRequests !== 0
        ) {
          notificationSound.playNotificationSound().catch(console.error);
        }

        setPrevPendingChatRequests(pendingCount); // Fix: Set previous count to current count
        setPendingChatRequests(pendingCount);
      });
    } catch (error) {
      console.error("Error loading pending chat requests count:", error);
      setPendingChatRequests(0);
    }
  };

  // Load unread messages count
  const loadUnreadMessagesCount = (rollNumber) => {
    try {
      const unreadRef = ref(db, `unreadCounts/${rollNumber}`);

      onValue(unreadRef, (snapshot) => {
        const data = snapshot.val() || {};
        const totalUnread = Object.values(data).reduce(
          (total, count) => total + (count || 0),
          0,
        );

        // Play sound notification if count increased (new message received)
        if (
          totalUnread > prevUnreadMessagesCount &&
          prevUnreadMessagesCount !== 0
        ) {
          notificationSound.playNotificationSound().catch(console.error);
        }

        setPrevUnreadMessagesCount(totalUnread); // Fix: Set previous count to current count
        setUnreadMessagesCount(totalUnread);
      });
    } catch (error) {
      console.error("Error loading unread messages count:", error);
      setUnreadMessagesCount(0);
    }
  };

  // Load group unread count
  const loadGroupUnreadCount = (rollNumber) => {
    try {
      const userGroup = getUserGroup(rollNumber);
      if (!userGroup) {
        return;
      }

      const unreadRef = ref(
        db,
        `groupUnreadCounts/${userGroup.id}/${rollNumber}`,
      );

      onValue(unreadRef, (snapshot) => {
        const count = snapshot.val() || 0;
        console.log(
          `[DASHBOARD] Group unread count changed: ${prevGroupUnreadCount} -> ${count}`,
        );

        // Play sound notification if count increased (new group message received)
        if (count > prevGroupUnreadCount && prevGroupUnreadCount !== 0) {
          console.log(
            `[DASHBOARD] Playing notification sound for group message`,
          );
          notificationSound.playNotificationSound().catch(console.error);
        }

        setPrevGroupUnreadCount(count); // Fix: Set previous count to current count
        setGroupUnreadCount(count);
      });
    } catch (error) {
      console.error("Error loading group unread count:", error);
      setGroupUnreadCount(0);
    }
  };
  return (
    <>
      {/* Chat Bubbles */}
      <div className="fixed bottom-6 right-6 z-[55] sm:bottom-8 sm:right-8 flex flex-col gap-4">
        {/* Group Chat Bubble */}
        <button
          onClick={async () => {
            setIsGroupChatOpen(true);

            // Clear unread count when opening group chat
            if (user?.roll) {
              try {
                const userGroup = getUserGroup(user.roll);
                if (userGroup && groupUnreadCount > 0) {
                  const unreadRef = ref(
                    db,
                    `groupUnreadCounts/${userGroup.id}/${user.roll}`,
                  );
                  await update(ref(db, `groupUnreadCounts/${userGroup.id}`), {
                    [user.roll]: 0,
                  });
                }
                setGroupUnreadCount(0);
                setPrevGroupUnreadCount(0);
              } catch (error) {
                console.error("Error clearing group unread count:", error);
              }
            }
          }}
          className="relative group w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 hover:from-green-400 hover:via-emerald-500 hover:to-teal-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 border-2 border-white/20 backdrop-blur-sm flex items-center justify-center"
          title="Group Chat"
        >
          {/* Group chat icon */}
          <div className="relative">
            {/* <i className="fas fa-users text-xl sm:text-2xl filter drop-shadow-sm"></i> */}

            {/* Notification badge - only show when there are unread messages */}
            {/* {groupUnreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
                {groupUnreadCount > 9 ? "9+" : groupUnreadCount}
              </span>
            )} */}

            {/* Enhanced Online indicator with accurate presence detection */}
            {/* <div className="absolute -bottom-1 -right-1 flex items-center justify-center">
              <div className="relative">
                <div className="w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-md"></div>
                <div className="absolute top-0 left-0 w-4 h-4 bg-green-300 rounded-full animate-pulse"></div>
                <div className="absolute top-0 left-0 w-4 h-4 bg-green-400 rounded-full animate-ping opacity-75"></div>
              </div>
            </div> */}
          </div>

          {/* Enhanced tooltip */}
          {/* <div className="hidden sm:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-3 bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-2xl border border-gray-700/50">
            <div className="flex items-center gap-2">
              <i className="fas fa-users text-green-400"></i>
              <span className="font-semibold">Group Chat</span>
            </div>
            {groupUnreadCount > 0 && (
              <div className="text-xs text-yellow-300 mt-2 text-center font-medium">
                � {groupUnreadCount} new message
                {groupUnreadCount > 1 ? "s" : ""}!
              </div>
            )}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900/95"></div>
          </div> */}

          {/* Floating animation rings */}
          {/* <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping"></div>
          <div className="absolute inset-0 rounded-full border border-white/20 animate-pulse"></div> */}
        </button>

        {/* P2P Chat Bubble */}
        <button
          onClick={() => openP2PChat()}
          className="relative group w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 hover:from-blue-400 hover:via-indigo-500 hover:to-purple-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 border-2 border-white/20 backdrop-blur-sm flex items-center justify-center"
          title="P2P Chat"
        >
          {/* Chat icon with enhanced styling */}
          <div className="relative">
            <i className="fab fa-facebook-messenger text-xl sm:text-2xl filter drop-shadow-sm"></i>
            {/* Notification badge for pending requests or unread messages */}
            {(pendingChatRequests > 0 || unreadMessagesCount > 0) && (
              <span className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
                {pendingChatRequests + unreadMessagesCount > 9
                  ? "9+"
                  : pendingChatRequests + unreadMessagesCount}
              </span>
            )}
            {/* Enhanced online indicator with accurate pulse system */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4">
              {/* Primary indicator dot */}
              <div className="relative w-full h-full bg-green-400 rounded-full border-2 border-white">
                {/* Inner pulse */}
                <div className="absolute inset-0.5 bg-green-300 rounded-full animate-pulse"></div>
                {/* Outer pulse rings */}
                <div className="absolute -inset-1 bg-green-400/60 rounded-full animate-ping"></div>
                <div className="absolute -inset-0.5 bg-green-300/40 rounded-full animate-pulse"></div>
                {/* Core dot */}
                <div className="relative w-1.5 h-1.5 bg-white rounded-full animate-pulse mx-auto mt-0.5"></div>
              </div>
            </div>
          </div>

          {/* Enhanced tooltip */}
          <div className="hidden sm:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-2 bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-xl border border-gray-700">
            <div className="flex items-center gap-2">
              <i className="fab fa-facebook-messenger text-blue-400"></i>
              <span className="font-medium">P2P Chat with Classmates</span>
            </div>
            {(pendingChatRequests > 0 || unreadMessagesCount > 0) && (
              <div className="text-xs text-yellow-300 mt-1 text-center">
                {pendingChatRequests > 0 && (
                  <div>
                    🔔 {pendingChatRequests} pending request
                    {pendingChatRequests > 1 ? "s" : ""}
                  </div>
                )}
                {unreadMessagesCount > 0 && (
                  <div>
                    💬 {unreadMessagesCount} unread message
                    {unreadMessagesCount > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            )}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900/95"></div>
          </div>

          {/* Floating animation rings */}
          <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping"></div>
          <div className="absolute inset-0 rounded-full border border-white/20 animate-pulse"></div>
        </button>
      </div>

      {/* P2P Chat Modal */}
      {/* <P2PChat
        userRoll={user?.roll}
        userName={user?.name}
        isOpen={isP2PChatOpen}
        onClose={() => closeP2PChat()}
      /> */}

      {/* Group Chat Modal */}
      {/* <GroupChat
        userRoll={user?.roll}
        userName={user?.name}
        isOpen={isGroupChatOpen}
        onClose={() => setIsGroupChatOpen(false)}
        onUnreadCountChange={(count) => {
          setGroupUnreadCount(count);
          setPrevGroupUnreadCount(count);
        }}
      /> */}
    </>
  );
}
