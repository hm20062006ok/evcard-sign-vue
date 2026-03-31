export async function onRequest(context) {
  // const response = await context.next();
  // response.headers.set('My-Header', 'Test');
  // return response;
  return new Response("Hello, world!");
}
