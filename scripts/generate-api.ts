/**
 * OpenAPI/Swagger 스펙으로부터 type-safe API 클라이언트 자동 생성.
 *
 * 사용:
 *   1) 백엔드의 openapi.json (또는 swagger.json) 을 프로젝트 루트로 복사하거나
 *      URL로부터 fetch.
 *   2) `npm run generate:api`
 *
 * 결과:
 *   src/generated/api 디렉토리 (수정 금지 - 아키텍처 문서 9번)
 *
 * 권장:
 *   백엔드 서버 URL에서 자동 fetch하려면 아래 fetchSpec() 사용.
 */

import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const SPEC_URL = process.env.OPENAPI_URL ?? 'http://localhost:8080/v3/api-docs';
const OUTPUT = './src/generated/api';
const SPEC_FILE = './openapi.json';

async function fetchSpec() {
  // Node 18+ global fetch
  const res = await fetch(SPEC_URL);
  if (!res.ok) throw new Error(`Failed to fetch spec: ${res.status}`);
  const text = await res.text();
  writeFileSync(SPEC_FILE, text);
  console.log(`✓ Spec saved to ${SPEC_FILE}`);
}

async function main() {
  await fetchSpec();
  execSync(
    `npx openapi --input ${SPEC_FILE} --output ${OUTPUT} --client axios --useOptions --useUnionTypes`,
    { stdio: 'inherit' },
  );
  console.log(`✓ Generated API client at ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
