// Hook pour surveiller le statut reseau
import { useState, useEffect } from 'react';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  isWifi: boolean;
  isCellular: boolean;
}

// Type pour NetInfo (optionnel)
interface NetInfoState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string;
}

type NetInfoSubscription = () => void;

// Import dynamique de NetInfo (optionnel)
let NetInfo: {
  fetch: () => Promise<NetInfoState>;
  addEventListener: (callback: (state: NetInfoState) => void) => NetInfoSubscription;
} | null = null;

try {
  // Essaye d'importer NetInfo si disponible
  NetInfo = require('@react-native-community/netinfo').default;
} catch {
  // NetInfo non installe, on utilisera les valeurs par defaut
}

/**
 * Hook pour surveiller le statut reseau
 * Note: Necessite @react-native-community/netinfo (optionnel)
 * Si non installe, retourne un statut "toujours connecte"
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
    isWifi: false,
    isCellular: false,
  });

  useEffect(() => {
    if (!NetInfo) {
      // NetInfo non disponible, on assume qu'on est connecte
      return;
    }

    let unsubscribe: NetInfoSubscription | null = null;

    const handleConnectivityChange = (state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
      });
    };

    // Fetch initial state
    NetInfo.fetch().then(handleConnectivityChange).catch(() => {
      // Erreur, on garde le statut par defaut
    });

    // Subscribe to changes
    unsubscribe = NetInfo.addEventListener(handleConnectivityChange);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return status;
}

/**
 * Hook simple pour savoir si on est en ligne
 */
export function useIsOnline(): boolean {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  return isConnected && isInternetReachable !== false;
}

/**
 * Hook pour executer une action quand le reseau revient
 */
export function useOnReconnect(callback: () => void): void {
  const [wasOffline, setWasOffline] = useState(false);
  const isOnline = useIsOnline();

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      // On vient de se reconnecter
      callback();
      setWasOffline(false);
    }
  }, [isOnline, wasOffline, callback]);
}
