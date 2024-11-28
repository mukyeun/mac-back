const createCsvContent = (data) => {
  // CSV 헤더
  const headers = ['Date', 'Weight', 'Height', 'Systolic', 'Diastolic', 'Steps'];
  const rows = [headers.join(',')];

  // 데이터가 없어도 최소한 헤더 다음에 빈 줄이 있어야 함
  if (data.length === 0) {
    rows.push('');
  } else {
    // 데이터 행 추가
    data.forEach(item => {
      const row = [
        item.date.toISOString().split('T')[0],
        item.weight || '',
        item.height || '',
        item.bloodPressure?.systolic || '',
        item.bloodPressure?.diastolic || '',
        item.steps || ''
      ];
      rows.push(row.join(','));
    });
  }

  return rows.join('\n');
};

const getExportFilename = (format) => {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  return `health-info-${date}.${format}`;
};

module.exports = {
  createCsvContent,
  getExportFilename
}; 