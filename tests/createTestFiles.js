const fs = require('fs');
const path = require('path');

// fixtures 디렉토리 생성
const fixturesDir = path.join(__dirname, 'fixtures');
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir);
}

// 작은 테스트 이미지 (1x1 픽셀 투명 PNG)
const smallImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// 텍스트 파일 내용
const textFileContent = 'This is a test file';

// 큰 이미지 생성 (5MB 이상)
const createLargeFile = () => {
  const buffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
  buffer.fill('0');
  return buffer;
};

// 파일 생성
fs.writeFileSync(
  path.join(fixturesDir, 'test-image.jpg'),
  Buffer.from(smallImageBase64, 'base64')
);

fs.writeFileSync(
  path.join(fixturesDir, 'test-file.txt'),
  textFileContent
);

fs.writeFileSync(
  path.join(fixturesDir, 'large-image.jpg'),
  createLargeFile()
);

console.log('Test files created successfully!'); 