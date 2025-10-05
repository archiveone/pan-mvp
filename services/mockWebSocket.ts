// services/mockWebSocket.ts

/**
 * This is a mock WebSocket server to simulate real-time chat functionality
 * without a real backend. It manages listeners (clients) for different "rooms" (groupIds)
 * and broadcasts messages to them.
 */

type MessageListener = (message: any) => void;

// Stores listeners keyed by groupId
const listeners = new Map<string, Set<MessageListener>>();

interface MockSocket {
  send: (message: any) => void;
  close: () => void;
}

/**
 * Simulates a client connecting to a WebSocket room.
 * @param groupId The ID of the chat room to join.
 * @param onMessageCallback The function to call when a message is received.
 * @returns A mock socket object with `send` and `close` methods.
 */
export function connect(groupId: string, onMessageCallback: MessageListener): MockSocket {
  // Get or create a set of listeners for this group
  let groupListeners = listeners.get(groupId);
  if (!groupListeners) {
    groupListeners = new Set();
    listeners.set(groupId, groupListeners);
  }

  // Add the new callback to the set
  groupListeners.add(onMessageCallback);
  console.log(`[WebSocket Mock] Client connected to group ${groupId}. Total clients: ${groupListeners.size}`);

  /**
   * Simulates sending a message to the server, which then broadcasts it.
   * @param message The message payload to send.
   */
  const send = (message: any) => {
    const targetListeners = listeners.get(groupId);
    if (targetListeners) {
      console.log(`[WebSocket Mock] Broadcasting message to ${targetListeners.size - 1} other clients in group ${groupId}.`);
      // Broadcast to all listeners in the group EXCEPT the sender
      targetListeners.forEach(listener => {
        if (listener !== onMessageCallback) {
          // Simulate network delay
          setTimeout(() => listener(message), Math.random() * 200 + 50);
        }
      });
    }
  };

  /**
   * Simulates disconnecting from the WebSocket room.
   */
  const close = () => {
    const groupListeners = listeners.get(groupId);
    if (groupListeners) {
      groupListeners.delete(onMessageCallback);
      console.log(`[WebSocket Mock] Client disconnected from group ${groupId}. Remaining clients: ${groupListeners.size}`);
      if (groupListeners.size === 0) {
        listeners.delete(groupId);
      }
    }
  };

  return { send, close };
}