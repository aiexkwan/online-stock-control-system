// Mock for @apollo/client
const gql = jest.fn((strings, ...values) => {
  // Simple template literal concatenation
  let result = '';
  strings.forEach((string, i) => {
    result += string;
    if (values[i]) {
      result += values[i];
    }
  });
  return result;
});

const useQuery = jest.fn(() => ({
  data: null,
  loading: false,
  error: null,
  refetch: jest.fn(() => Promise.resolve({ data: null })),
}));

const useLazyQuery = jest.fn(() => [
  jest.fn(() => Promise.resolve({ data: null })),
  {
    data: null,
    loading: false,
    error: null,
    called: false,
  }
]);

const useMutation = jest.fn(() => [
  jest.fn(() => Promise.resolve({ data: null })),
  {
    data: null,
    loading: false,
    error: null,
    called: false,
  }
]);

const useApolloClient = jest.fn(() => ({
  query: jest.fn(() => Promise.resolve({ data: null })),
  mutate: jest.fn(() => Promise.resolve({ data: null })),
  watchQuery: jest.fn(() => ({
    subscribe: jest.fn(),
    refetch: jest.fn(),
  })),
  readQuery: jest.fn(),
  writeQuery: jest.fn(),
  cache: {
    readQuery: jest.fn(),
    writeQuery: jest.fn(),
    evict: jest.fn(),
    gc: jest.fn(),
    modify: jest.fn(),
  },
}));

const ApolloClient = jest.fn(function() {
  return {
    query: jest.fn(() => Promise.resolve({ data: null })),
    mutate: jest.fn(() => Promise.resolve({ data: null })),
    watchQuery: jest.fn(() => ({
      subscribe: jest.fn(),
      refetch: jest.fn(),
    })),
    readQuery: jest.fn(),
    writeQuery: jest.fn(),
    cache: {
      readQuery: jest.fn(),
      writeQuery: jest.fn(),
      evict: jest.fn(),
      gc: jest.fn(),
      modify: jest.fn(),
    },
    clearStore: jest.fn(() => Promise.resolve()),
    resetStore: jest.fn(() => Promise.resolve()),
    onResetStore: jest.fn(),
    onClearStore: jest.fn(),
  };
});

const InMemoryCache = jest.fn(function() {
  return {
    readQuery: jest.fn(),
    writeQuery: jest.fn(),
    evict: jest.fn(),
    gc: jest.fn(),
    modify: jest.fn(),
  };
});

const ApolloProvider = ({ children }) => children;

const createHttpLink = jest.fn(() => ({}));

const ApolloLink = {
  from: jest.fn(() => ({})),
  split: jest.fn(() => ({})),
  concat: jest.fn(() => ({})),
};

const Observable = jest.fn();

const makeVar = jest.fn((initialValue) => {
  let value = initialValue;
  const reactiveVar = (newValue) => {
    if (newValue !== undefined) {
      value = newValue;
    }
    return value;
  };
  reactiveVar.mockImplementation = jest.fn();
  return reactiveVar;
});

const useReactiveVar = jest.fn((reactiveVar) => reactiveVar());

module.exports = {
  gql,
  useQuery,
  useLazyQuery,
  useMutation,
  useApolloClient,
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
  ApolloLink,
  Observable,
  makeVar,
  useReactiveVar,
  // Error types
  ApolloError: class ApolloError extends Error {
    constructor(message) {
      super(message);
      this.name = 'ApolloError';
    }
  },
  NetworkError: class NetworkError extends Error {
    constructor(message) {
      super(message);
      this.name = 'NetworkError';
    }
  },
  // Additional exports that might be used
  DocumentNode: {},
  TypeKind: {},
  // Network status
  NetworkStatus: {
    loading: 1,
    setVariables: 2,
    fetchMore: 3,
    refetch: 4,
    poll: 6,
    ready: 7,
    error: 8,
  },
};