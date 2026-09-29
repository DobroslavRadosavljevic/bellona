import { queryCode } from './fixtures.ts';
import { runQueryRule } from './harness.ts';

const unstable = [{ messageId: 'unstable' }];

runQueryRule('stable-query-client', {
  valid: [
    queryCode('const queryClient = new QueryClient();'),
    queryCode('export function createClient() { return new QueryClient(); }'),
    queryCode('function App() { const [client] = useState(() => new QueryClient()); }'),
    queryCode('function App() { const [client] = React.useState(new QueryClient()); }'),
    queryCode('function App() { const client = useRef(new QueryClient()); }'),
    queryCode('function App() { const client = useMemo(() => new QueryClient(), []); }'),
    queryCode('const App = () => { const onClick = () => new QueryClient(); return onClick; };'),
    // An async server component makes one client per request.
    queryCode('export default async function Page() { const client = new QueryClient(); }'),
    queryCode('function App() { class QueryClient {} const client = new QueryClient(); }'),
    'function App() { const client = new QueryClient(); }',
    {
      code: queryCode('function App() { const client = new QueryClient(); }'),
      filename: '/src/legacy/app.tsx',
      options: [{ allow: ['legacy'] }],
    },
  ],
  invalid: [
    {
      code: queryCode('function App() { const client = new QueryClient(); return client; }'),
      errors: unstable,
    },
    {
      code: queryCode(
        'const App = () => { const client = new QueryClient({ defaultOptions: {} }); };',
      ),
      errors: unstable,
    },
    {
      code: queryCode(
        'export const Providers = memo(function Providers() { const c = new QueryClient(); });',
      ),
      errors: unstable,
    },
    {
      code: queryCode('function useClient() { return new QueryClient(); }'),
      errors: unstable,
    },
    {
      code: 'import * as Q from "@tanstack/react-query";\nfunction App() { const c = new Q.QueryClient(); }',
      errors: unstable,
    },
  ],
});
