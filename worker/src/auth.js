export function authenticate(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;

  // Bearer token match against the shared secret
  const token = authHeader.replace('Bearer ', '').trim();
  return token === env.SHARED_SECRET;
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}