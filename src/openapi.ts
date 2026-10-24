import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Property Maintenance API')
    .setDescription(
      'Every endpoint requires an Auth0 access token (Bearer), except `/health`. Errors use the standard NestJS shape: `{ statusCode, error, message }`. Dates are ISO 8601 in UTC.',
    )
    .setVersion('0.0.1')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .build();
  return SwaggerModule.createDocument(app, config);
}

export function setUpOpenApi(app: INestApplication): void {
  SwaggerModule.setup('docs', app, () => createOpenApiDocument(app), { jsonDocumentUrl: 'docs/openapi.json' });
}
