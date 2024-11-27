const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Macjin API',
      version: '1.0.0',
      description: 'Macjin 서비스의 API 문서',
      contact: {
        name: 'API Support',
        email: 'support@macjin.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? 'https://api.macjin.com'
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? '운영 서버' : '개발 서버'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: '인증을 위한 JWT 토큰을 입력하세요'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error'
            },
            message: {
              type: 'string',
              example: '오류가 발생했습니다'
            }
          }
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./backend/routes/*.js', './backend/server.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;