import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../server/routers';
import { createContext } from '../../server/context';

export const config = { runtime: 'edge' };

export default function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200 });
  }

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext: () => createContext(request),
  });
}
