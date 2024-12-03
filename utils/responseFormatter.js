/**
 * 성공 응답을 위한 표준 형식
 * @param {any} data - 응답 데이터
 * @param {string} message - 응답 메시지
 * @param {number} statusCode - HTTP 상태 코드
 * @returns {Object} 표준화된 성공 응답 객체
 */
const successResponse = (data, message = '성공', statusCode = 200) => {
  return {
    status: 'success',
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * 에러 응답을 위한 표준 형식
 * @param {string} message - 에러 메시지
 * @param {number} statusCode - HTTP 상태 코드
 * @param {Object|null} errors - 상세 에러 정보
 * @returns {Object} 표준화된 에러 응답 객체
 */
const errorResponse = (message, statusCode = 400, errors = null) => {
  const response = {
    status: 'error',
    statusCode,
    message,
    timestamp: new Date().toISOString()
  };

  if (errors) {
    response.errors = Array.isArray(errors) 
      ? errors 
      : [{ message: errors.toString() }];
  }

  return response;
};

module.exports = {
  successResponse,
  errorResponse
};