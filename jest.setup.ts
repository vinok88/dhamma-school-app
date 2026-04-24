// Global Jest setup. Mocks Expo, native modules, and UI primitives so screen
// tests can render without a device. Hook modules are NOT auto-mocked here —
// individual screen tests opt into the hooks they need.

process.env.EXPO_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'test-google-client-id';

// ---------- Native modules ----------

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
  launchCameraAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestCameraPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('expo-image', () => {
  const { Image } = require('react-native');
  return { Image };
});

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: 'ExpoToken[test]' })),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: '/tmp/',
  readAsStringAsync: jest.fn(async () => ''),
  writeAsStringAsync: jest.fn(async () => undefined),
  EncodingType: { Base64: 'base64', UTF8: 'utf8' },
}));

jest.mock('expo-linking', () => ({
  openURL: jest.fn(async () => undefined),
  createURL: jest.fn((path: string) => `dhamma://${path}`),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(async () => true),
    signIn: jest.fn(async () => ({ data: { idToken: 'test-id-token' } })),
    signOut: jest.fn(async () => undefined),
  },
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaView: ({ children, ...p }: any) => React.createElement(View, p, children),
    SafeAreaProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

// ---------- expo-router ----------

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  }),
  useIsFocused: () => true,
}));

jest.mock('expo-router', () => {
  const React = require('react');
  const { View } = require('react-native');
  const passthrough = ({ children }: any) => React.createElement(View, null, children);
  return {
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      navigate: jest.fn(),
      setParams: jest.fn(),
    }),
    useLocalSearchParams: () => ({}),
    useSegments: () => [],
    usePathname: () => '/',
    Stack: Object.assign(passthrough, { Screen: passthrough }),
    Tabs: Object.assign(passthrough, { Screen: passthrough }),
    Link: ({ children }: any) => children,
    Redirect: () => null,
  };
});

// ---------- Charts and calendars (heavy native deps) ----------

jest.mock('react-native-chart-kit', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Stub = (props: any) => React.createElement(View, props);
  return { LineChart: Stub, BarChart: Stub, PieChart: Stub, ProgressChart: Stub };
});

jest.mock('react-native-calendars', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Stub = (props: any) => React.createElement(View, props);
  return { Calendar: Stub, Agenda: Stub, CalendarList: Stub };
});

jest.mock('react-native-modal-datetime-picker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { __esModule: true, default: (props: any) => React.createElement(View, props) };
});

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { __esModule: true, default: (props: any) => React.createElement(View, props) };
});

jest.mock('react-native-google-places-autocomplete', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { GooglePlacesAutocomplete: (props: any) => React.createElement(View, props) };
});

jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Stub = (props: any) => React.createElement(View, props);
  return new Proxy(
    { __esModule: true, default: Stub },
    { get: (t, p) => (p in t ? (t as any)[p] : Stub) },
  );
});

// ---------- UI primitives ----------
// Stub heavy/animated UI to keep tests focused on screen logic.

jest.mock('@/components/ui/Avatar', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { Avatar: (props: any) => React.createElement(View, { testID: 'avatar', ...props }) };
});

jest.mock('@/components/ui/Badge', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { Badge: ({ label }: { label: string }) => React.createElement(Text, null, label) };
});

jest.mock('@/components/ui/LoadingSpinner', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { LoadingSpinner: () => React.createElement(View, { testID: 'loading-spinner' }) };
});

jest.mock('@/components/ui/EmptyState', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  return {
    EmptyState: ({ title, subtitle }: { title?: string; subtitle?: string }) =>
      React.createElement(
        View,
        { testID: 'empty-state' },
        title && React.createElement(Text, null, title),
        subtitle && React.createElement(Text, null, subtitle),
      ),
  };
});

jest.mock('@/components/ui/ScreenHeader', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  return {
    ScreenHeader: ({ title }: { title?: string }) =>
      React.createElement(View, { testID: 'screen-header' }, title && React.createElement(Text, null, title)),
  };
});

jest.mock('@/components/ui/UserDetailModal', () => ({ UserDetailModal: () => null }));

jest.mock('@/components/ui/AddressAutocomplete', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { AddressAutocomplete: (props: any) => React.createElement(View, props) };
});

jest.mock('@/components/ui/DatePicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { DatePicker: (props: any) => React.createElement(View, props) };
});

// Silence noisy "act()" warnings from react-query in hook tests by collapsing them.
const origError = console.error;
console.error = (msg: any, ...rest: any[]) => {
  if (typeof msg === 'string' && msg.includes('not wrapped in act')) return;
  origError(msg, ...rest);
};
