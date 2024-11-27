const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    return Array.from(tests).sort((testA, testB) => {
      // 비밀번호 복잡성 테스트를 먼저 실행
      if (testA.path.includes('password')) return -1;
      if (testB.path.includes('password')) return 1;
      
      // rate limit 테스트를 마지막에 실행
      if (testA.path.includes('rate')) return 1;
      if (testB.path.includes('rate')) return -1;
      
      return 0;
    });
  }
}

module.exports = CustomSequencer;
