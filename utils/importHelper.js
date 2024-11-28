const parseCsvContent = (content) => {
  const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
  if (lines.length < 2) {
    throw new Error('데이터가 없습니다');
  }

  const headers = lines[0].split(',');
  const expectedHeaders = ['Date', 'Weight', 'Height', 'Systolic', 'Diastolic', 'Steps'];
  
  if (!expectedHeaders.every(header => headers.includes(header))) {
    throw new Error('올바르지 않은 CSV 형식입니다');
  }

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length !== headers.length) {
      throw new Error('올바르지 않은 CSV 형식입니다');
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
          case 'Steps':
            row[header.toLowerCase()] = Number(value);
            break;
          case 'Systolic':
          case 'Diastolic':
            if (!row.bloodPressure) row.bloodPressure = {};
            row.bloodPressure[header.toLowerCase()] = Number(value);
            break;
        }
      }
    });

    data.push(row);
  }

  return data;
};

const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

module.exports = {
  parseCsvContent
}; 