// Conventional Commits
// 형식: <type>(<scope>): <subject>
// 예: feat(letter): 5글자 작성 폼 검증 강화

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'perf', 'style', 'docs', 'test', 'chore', 'ci', 'build'],
    ],
    'subject-case': [0], // 한글 허용
  },
};
