import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from '../docs/openapi.definition.js';

const swaggerConfig = (app) => {
	app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
};

export default swaggerConfig;