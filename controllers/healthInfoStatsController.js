const HealthInfo = require('../models/HealthInfo');
const logger = require('../utils/logger');

/**
 * 건강 정보 통계 계산
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getHealthStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = { userId: req.user.userId };

        // 날짜 범위 필터 적용
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        // 데이터 조회
        const healthInfos = await HealthInfo.find(query).sort({ date: 1 });

        if (healthInfos.length === 0) {
            return res.status(404).json({
                success: false,
                message: '건강 정보가 없습니다'
            });
        }

        // 통계 계산
        const stats = {
            weight: calculateStats(healthInfos.map(info => info.weight)),
            height: calculateStats(healthInfos.map(info => info.height)),
            bloodPressure: {
                systolic: calculateStats(healthInfos.map(info => info.bloodPressure?.systolic)),
                diastolic: calculateStats(healthInfos.map(info => info.bloodPressure?.diastolic))
            },
            steps: {
                ...calculateStats(healthInfos.map(info => info.steps)),
                total: healthInfos.reduce((sum, info) => sum + (info.steps || 0), 0)
            },
            dateRange: {
                start: healthInfos[0].date,
                end: healthInfos[healthInfos.length - 1].date,
                count: healthInfos.length
            }
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        logger.error('Health stats calculation error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * 기본 통계 계산 함수
 * @param {Array<number>} values - 계산할 숫자 배열
 * @returns {Object} 통계 결과
 */
const calculateStats = (values) => {
    const filteredValues = values.filter(v => v != null && !isNaN(v));
    
    if (filteredValues.length === 0) {
        return {
            avg: null,
            min: null,
            max: null,
            count: 0
        };
    }

    return {
        avg: filteredValues.reduce((sum, val) => sum + val, 0) / filteredValues.length,
        min: Math.min(...filteredValues),
        max: Math.max(...filteredValues),
        count: filteredValues.length
    };
};

module.exports = {
    getHealthStats
}; 