const HealthInfo = require('../models/HealthInfo');
const logger = require('../utils/logger');

/**
 * CSV 파일에서 건강 정보를 가져와 데이터베이스에 저장
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const importHealthInfo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '파일이 업로드되지 않았습니다'
            });
        }

        // CSV 파일 내용 파싱
        const csvContent = req.file.buffer.toString('utf-8');
        const lines = csvContent.split('\n').map(line => line.trim()).filter(Boolean);
        
        // 헤더 검증
        const headers = lines[0].split(',');
        const expectedHeaders = ['Date', 'Weight', 'Height', 'Systolic', 'Diastolic', 'Steps'];
        
        if (!expectedHeaders.every(header => headers.includes(header))) {
            return res.status(400).json({
                success: false,
                message: '올바르지 않은 CSV 형식입니다'
            });
        }

        // 데이터 파싱
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length !== headers.length) {
                return res.status(400).json({
                    success: false,
                    message: '올바르지 않은 CSV 형식입니다'
                });
            }

            const row = {};
            headers.forEach((header, index) => {
                const value = values[index].trim();
                if (value) {
                    switch (header) {
                        case 'Date':
                            if (!isValidDate(value)) {
                                throw new Error('올바르지 않은 날짜 형식입니다');
                            }
                            row.date = new Date(value);
                            break;
                        case 'Weight':
                        case 'Height':
                            row[header.toLowerCase()] = Number(value);
                            break;
                        case 'Systolic':
                        case 'Diastolic':
                            if (!row.bloodPressure) row.bloodPressure = {};
                            row.bloodPressure[header.toLowerCase()] = Number(value);
                            break;
                        case 'Steps':
                            row.steps = Number(value);
                            break;
                    }
                }
            });
            data.push(row);
        }

        // 날짜 중복 검사
        const dates = data.map(item => item.date);
        const existingDates = await HealthInfo.find({
            userId: req.user.userId,
            date: { $in: dates }
        }).select('date');

        if (existingDates.length > 0) {
            return res.status(400).json({
                success: false,
                message: '이미 존재하는 날짜의 데이터가 있습니다'
            });
        }

        // 데이터베이스에 저장
        const healthInfos = data.map(item => ({
            ...item,
            userId: req.user.userId
        }));

        await HealthInfo.insertMany(healthInfos);
        logger.debug('Health info imported:', { userId: req.user.userId, count: healthInfos.length });

        res.status(200).json({
            success: true,
            message: '건강 정보가 성공적으로 가져와졌습니다',
            imported: healthInfos.length
        });

    } catch (error) {
        logger.error('Health info import error:', error);
        res.status(400).json({
            success: false,
            message: error.message || '서버 오류가 발생했습니다'
        });
    }
};

/**
 * 날짜 유효성 검사
 * @param {string} dateString - 검사할 날짜 문자열
 * @returns {boolean} 유효한 날짜인지 여부
 */
const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
};

module.exports = {
    importHealthInfo
}; 