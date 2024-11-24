/**
 * 성공 응답을 위한 표준 형식
 */
const successResponse = (data, message = '성공', statusCode = 200) => {
    return {
      status: 'success',
      statusCode,
      message,
      data
    };
  };
  
  /**
   * 에러 응답을 위한 표준 형식
   */
  const errorResponse = (message, statusCode = 400, errors = null) => {
    const response = {
      status: 'error',
      statusCode,
      message
    };
  
    if (errors) {
      response.errors = errors;
    }
  
    return response;
  };
  
  module.exports = {
    successResponse,
    errorResponse
  };