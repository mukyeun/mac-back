const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Health Info API',
      version: '1.0.0',
      description: '건강 정보 관리 시스템 API 문서',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: '개발 서버',
      },
    ],
    components: {
      schemas: {
        HealthInfo: {
          type: 'object',
          properties: {
            기본정보: {
              type: 'object',
              properties: {
                이름: { type: 'string', example: '홍길동' },
                주민번호: { type: 'string', example: '800101-1234567' },
                연락처: { type: 'string', example: '010-1234-5678' },
                성별: { type: 'string', enum: ['남', '여'] },
                나이: { type: 'number', example: 43 },
                키: { type: 'number', example: 175 },
                체중: { type: 'number', example: 70 },
                BMI: { type: 'number', example: 22.9 }
              }
            },
            건강정보: {
              type: 'object',
              properties: {
                혈압: {
                  type: 'object',
                  properties: {
                    수축기: { type: 'number', example: 120 },
                    이완기: { type: 'number', example: 80 }
                  }
                },
                혈당: { type: 'number', example: 95 },
                체온: { type: 'number', example: 36.5 },
                산소포화도: { type: 'number', example: 98 }
              }
            },
            증상: {
              type: 'array',
              items: { type: 'string' },
              example: ['두통', '어지러움']
            },
            메모: { type: 'string', example: '특이사항 없음' },
            userId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        User: {
          type: 'object',
          required: ['username', 'email', 'password', 'name'],
          properties: {
            _id: { type: 'string', description: '사용자 ID' },
            username: { type: 'string', example: 'user123', description: '사용자명' },
            email: { type: 'string', format: 'email', example: 'user@example.com', description: '이메일' },
            password: { type: 'string', format: 'password', example: 'password123', description: '비밀번호' },
            name: { type: 'string', example: '홍길동', description: '이름' },
            createdAt: { type: 'string', format: 'date-time', description: '생성일' }
          }
        },
        Symptom: {
          type: 'object',
          required: ['category', 'description', 'severity'],
          properties: {
            userId: { type: 'string' },
            category: { 
              type: 'string',
              enum: ['두통', '복통', '근육통', '기침', '기타'],
              example: '두통'
            },
            description: { type: 'string', example: '오후부터 지속된 두통' },
            severity: { 
              type: 'string',
              enum: ['약함', '보통', '심함'],
              example: '보통'
            },
            duration: { type: 'string', example: '2시간' },
            notes: { type: 'string', example: '약 복용 후 호전' },
            date: { type: 'string', format: 'date-time' }
          }
        },
        UserProfile: {
          type: 'object',
          properties: {
            name: { 
              type: 'string', 
              description: '사용자 이름',
              example: '홍길동' 
            },
            username: { 
              type: 'string', 
              description: '사용자명',
              example: 'honggildong' 
            }
          }
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./routes/*.js', './models/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;