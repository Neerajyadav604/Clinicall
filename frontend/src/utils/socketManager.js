import socket from './socket';

/**
 * Global Socket Manager
 * Controls socket connection lifecycle at the app level only.
 * Once connected, stays connected unless user logs out.
 * Never call connect/disconnect from individual components.
 */

let connectionAttempt = false;
let lastConnectTime = 0;
let currentToken = null;

/**
 * Establish socket connection with auth token
 * Safe to call multiple times — only connects if not already connected
 * Handles reconnection after disconnect properly
 */
export const connectSocket = (token) => {
  if (!token) {
    console.warn('⚠️ [Socket] Cannot connect without auth token');
    return;
  }

  currentToken = token;

  // If already connected, skip
  if (socket.connected) {
    console.log('📍 [Socket] Already connected, skipping');
    return;
  }

  // If already trying to connect, skip (but reset if it's been > 10s)
  if (connectionAttempt) {
    const timeSinceLastAttempt = Date.now() - lastConnectTime;
    if (timeSinceLastAttempt < 10000) {
      console.log('📍 [Socket] Connection attempt already in progress, skipping');
      return;
    }
    console.log('🔄 [Socket] Previous connection attempt timed out, retrying...');
    connectionAttempt = false;
  }

  connectionAttempt = true;
  lastConnectTime = Date.now();
  console.log('🔌 [Socket] Attempting connection with token...');
  console.log('  Socket state before connect:', {
    connected: socket.connected,
    connecting: socket.connecting,
    disconnected: socket.disconnected,
  });

  try {
    socket.auth = { token };
    socket.connect();
    
    console.log('📍 [Socket] Called socket.connect()');
    
    // Listen for successful connection
    socket.once('connect', () => {
      console.log('✅ [Socket] Connected successfully, socket ID:', socket.id);
      connectionAttempt = false;
      
      // Set up disconnect handler for automatic reconnection
      setupDisconnectHandler();
    });
    
    socket.once('connect_error', (error) => {
      console.error('❌ [Socket] Connection error:', error.message);
      connectionAttempt = false;
      
      // Try again after a delay
      console.log('🔄 [Socket] Scheduling reconnect attempt...');
      setTimeout(() => {
        if (!socket.connected && currentToken) {
          connectSocket(currentToken);
        }
      }, 3000);
    });
  } catch (error) {
    console.error('❌ [Socket] Connection failed:', error.message);
    connectionAttempt = false;
  }
};

/**
 * Set up automatic reconnection on disconnect
 */
const setupDisconnectHandler = () => {
  // Remove old handler first
  socket.off('disconnect', handleDisconnect);
  
  // Add new handler
  socket.on('disconnect', handleDisconnect);
};

const handleDisconnect = (reason) => {
  console.log('🔌 [Socket] Disconnected, reason:', reason);
  
  // Don't try to reconnect if it was an intentional disconnect (logout)
  if (reason === 'io client namespace disconnect' || !currentToken) {
    return;
  }
  
  // Try to reconnect after a delay for unintentional disconnects
  console.log('🔄 [Socket] Attempting automatic reconnect...');
  setTimeout(() => {
    if (!socket.connected && currentToken) {
      connectSocket(currentToken);
    }
  }, 2000);
};

/**
 * Disconnect socket cleanly
 * Safe to call even if not connected
 */
export const disconnectSocket = () => {
  currentToken = null;  // Clear token to prevent auto-reconnect
  
  if (socket.connected) {
    console.log('🔌 [Socket] Disconnecting...');
    socket.off('disconnect', handleDisconnect);  // Remove auto-reconnect handler
    socket.disconnect();
    console.log('✅ [Socket] Disconnected');
  }
};

/**
 * Check if socket is currently connected
 */
export const isSocketConnected = () => {
  return socket.connected;
};

export default socket;
