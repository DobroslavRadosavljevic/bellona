import { queryCode } from './fixtures.ts';
import { runQueryRule } from './harness.ts';

function missing(name: string) {
  return { messageId: 'missing', data: { name } };
}

runQueryRule('exhaustive-deps', {
  valid: [
    queryCode(
      'function useTodo(id) { return useQuery({ queryKey: ["todo", id], queryFn: () => fetchTodo(id) }); }',
    ),
    queryCode(
      'function useTodo(todo) { return useQuery({ queryKey: ["todo", todo.id], queryFn: () => fetchTodo(todo.id) }); }',
    ),
    queryCode(
      'function useTodo(id) { return useQuery({ queryKey: ["todo", { id }], queryFn: () => fetchTodo(id) }); }',
    ),
    // Imports, module constants, and functions are stable.
    queryCode(
      'const LIMIT = 10; function useTodos() { return useQuery({ queryKey: ["todos"], queryFn: () => fetchTodos(LIMIT) }); }',
    ),
    queryCode(
      'function useTodos() { const load = () => fetchTodos(); return useQuery({ queryKey: ["todos"], queryFn: () => load() }); }',
    ),
    queryCode(
      'function useTodos(api) { return useQuery({ queryKey: ["todos"], queryFn: () => api.todos.list() }); }',
    ),
    queryCode(
      'function useTodos() { const queryClient = useQueryClient(); return useQuery({ queryKey: ["todos"], queryFn: () => read(queryClient) }); }',
    ),
    queryCode(
      'function useTodos() { return useQuery({ queryKey: ["todos"], queryFn: ({ signal }) => fetchTodos(signal) }); }',
    ),
    queryCode(
      'function useTodo(id) { return useQuery({ queryKey: ["todo"], queryFn: fetchTodo }); }',
    ),
    queryCode(
      'function useTodo(id) { const key = ["todo"]; return useQuery({ queryKey: key, queryFn: () => fetchTodo(id) }); }',
    ),
    queryCode(
      'function useTodo(id: string) { return useQuery({ queryKey: ["todo", id], queryFn: (): Promise<Todo> => fetchTodo(id as TodoId) }); }',
    ),
    // A local variable in the key covers the values in its initializer.
    queryCode(
      'function todoOptions(workspaceId, id) { const options = { path: { id } }; return queryOptions({ queryKey: [{ ...keyOf(options).queryKey[0], workspaceId }], queryFn: () => fetchTodo(id) }); }',
    ),
    'function useTodo(id) { return useQuery({ queryKey: ["todo"], queryFn: () => fetchTodo(id) }); }',
    {
      code: queryCode(
        'function useTodo(id) { return useQuery({ queryKey: ["todo"], queryFn: () => fetchTodo(id) }); }',
      ),
      filename: '/src/legacy/todo.ts',
      options: [{ allow: ['legacy'] }],
    },
  ],
  invalid: [
    {
      code: queryCode(
        'function useTodo(id) { return useQuery({ queryKey: ["todo"], queryFn: () => fetchTodo(id) }); }',
      ),
      errors: [missing('id')],
    },
    {
      code: queryCode(
        'const todoOptions = (id, page) => queryOptions({ queryKey: ["todo", id], queryFn: () => fetchTodo(id, page) });',
      ),
      errors: [missing('page')],
    },
    {
      code: queryCode(
        'function Todo({ id }) { const [filter] = useState("all"); useQuery({ queryKey: ["todo", id] as const, queryFn: async () => { const list = await fetchTodo(id); return list.filter((item) => item.kind === filter); } }); }',
      ),
      errors: [missing('filter')],
    },
    {
      code: queryCode(
        'function useTodo(id, enabled) { return useQuery({ queryKey: ["todo"], queryFn: enabled ? () => fetchTodo(id) : skipToken }); }',
      ),
      errors: [missing('id')],
    },
    {
      code: queryCode(
        'function useTodo(todo) { return useQuery({ queryKey: ["todo"], queryFn: () => fetchTodo(todo.id, todo.id) }); }',
      ),
      errors: [missing('todo')],
    },
  ],
});
