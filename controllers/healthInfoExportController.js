const HealthInfo = require('../models/HealthInfo');
const logger = require('../utils/logger');
const { format } = require('date-fns');

/**
 * 건강 정보를 CSV 또는 JSON 형식으로 내보내기
 */
const exportHealthInfo = async (req, res) => {
    try {
        const { format: exportFormat = 'csv', startDate, endDate } = req.query;
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
                message: '내보낼 데이터가 없습니다'
            });
        }

        // CSV 형식으로 내보내기
        if (exportFormat === 'csv') {
            const headers = ['Date', 'Weight', 'Height', 'Systolic', 'Diastolic', 'Steps'];
            const rows = healthInfos.map(info => [
                format(new Date(info.date), 'yyyy-MM-dd'),
                info.weight || '',
                info.height || '',
                info.bloodPressure?.systolic || '',
                info.bloodPressure?.diastolic || '',
                info.steps || ''
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            const filename = `health-info-${format(new Date(), 'yyyyMMdd')}.csv`;
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            return res.send(csvContent);
        }

        // JSON 형식으로 내보내기
        if (exportFormat === 'json') {
            const data = healthInfos.map(info => ({
                date: format(new Date(info.date), 'yyyy-MM-dd'),
                weight: info.weight,
                height: info.height,
                bloodPressure: info.bloodPressure,
                steps: info.steps
            }));

            return res.json({
                success: true,
                data
            });
        }

        // 지원하지 않는 형식
        res.status(400).json({
            success: false,
            message: '지원하지 않는 형식입니다'
        });

    } catch (error) {
        logger.error('Health info export error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
};

module.exports = {
    exportHealthInfo
}; 