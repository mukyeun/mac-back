const calculateStats = (data, field) => {
  if (!data || data.length === 0) {
    return {
      average: 0,
      min: 0,
      max: 0,
      trend: []
    };
  }

  const values = data.map(item => item[field]);
  const sum = values.reduce((acc, val) => acc + val, 0);

  return {
    average: Number((sum / values.length).toFixed(2)),
    min: Math.min(...values),
    max: Math.max(...values),
    trend: data.map(item => ({
      date: item.date.toISOString().split('T')[0],
      value: item[field]
    }))
  };
};

const calculateBloodPressureStats = (data) => {
  if (!data || data.length === 0) {
    return {
      systolic: { average: 0, min: 0, max: 0 },
      diastolic: { average: 0, min: 0, max: 0 },
      trend: []
    };
  }

  const systolicValues = data.map(item => item.bloodPressure.systolic);
  const diastolicValues = data.map(item => item.bloodPressure.diastolic);

  return {
    systolic: {
      average: Number((systolicValues.reduce((acc, val) => acc + val, 0) / systolicValues.length).toFixed(2)),
      min: Math.min(...systolicValues),
      max: Math.max(...systolicValues)
    },
    diastolic: {
      average: Number((diastolicValues.reduce((acc, val) => acc + val, 0) / diastolicValues.length).toFixed(2)),
      min: Math.min(...diastolicValues),
      max: Math.max(...diastolicValues)
    },
    trend: data.map(item => ({
      date: item.date.toISOString().split('T')[0],
      systolic: item.bloodPressure.systolic,
      diastolic: item.bloodPressure.diastolic
    }))
  };
};

module.exports = {
  calculateStats,
  calculateBloodPressureStats
}; 