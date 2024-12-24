import { type NextRequest } from "next/server";
import { openApiDocument } from '~/server/openapi';

// Respond with our OpenAPI schema
const handler = (req: NextRequest) => {
  return Response.json(openApiDocument);
};

export {
    handler as GET,
  };