const HealthInfo = require('../models/HealthInfo');
const logger = require('../utils/logger');
const { format } = require('date-fns');

/**
 * 건강 정보 차트 데이터 조회
 */
const getChartData = async (req, res) => {
    try {
        const { metric } = req.params;
        const { startDate, endDate } = req.query;
        const query = { userId: req.user.userId };

        // 날짜 범위 필터 적용
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        // 데이터 조회
        const healthInfos = await HealthInfo.find(query)
            .sort({ date: 1 })
            .lean();

        if (healthInfos.length === 0) {
            return res.status(404).json({
                success: false,
                message: '차트 데이터가 없습니다'
            });
        }

        // 날짜 라벨 생성
        const labels = healthInfos.map(info => 
            format(new Date(info.date), 'yyyy-MM-dd')
        );

        let datasets = [];

        // 지표별 데이터셋 생성
        switch (metric) {
            case 'weight':
                datasets = [{
                    label: '체중',
                    data: healthInfos.map(info => info.weight)
                }];
                break;

            case 'blood-pressure':
                datasets = [
                    {
                        label: '수축기 혈압',
                        data: healthInfos.map(info => info.bloodPressure?.systolic)
                    },
                    {
                        label: '이완기 혈압',
                        data: healthInfos.map(info => info.bloodPressure?.diastolic)
                    }
                ];
                break;

            case 'steps':
                datasets = [{
                    label: '걸음 수',
                    data: healthInfos.map(info => info.steps)
                }];
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: '지원하지 않는 지표입니다'
                });
        }

        res.json({
            success: true,
            data: {
                labels,
                datasets
            }
        });

    } catch (error) {
        logger.error('Chart data error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
};

module.exports = {
    getChartData
}; 