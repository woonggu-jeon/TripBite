import { LetterDetailClient } from './_components/LetterDetailClient';

/**
 * 편지 상세 페이지 (/letter/[id])
 *
 * 받은 편지 / 보낸 편지 카드 클릭 시 진입. `letter.isMine` 으로 화면이 갈리므로
 * (제목·카드 배치·액션이 모두 다르다) 헤더까지 클라이언트가 렌더한다.
 *
 * 표시:
 *   - 원고지 일러스트 위에 5글자 본문 노출
 *   - 닉네임 (없으면 "익명의 여행자")
 *   - 보낸 위치 (예: "충북 청주시")
 *   - 좋아요 버튼 (토글)
 *     - 누르면 보낸 사람에게 알림 발송 (서버 측 push)
 *   - 저장 버튼
 *     - 저장 X: 3일 후 자동 삭제
 *     - 저장 O: 마이페이지에서 영구 보관 + 삭제 가능
 *
 * 데이터:
 *   - useLetter(id) — features/letter
 *   - useLikeLetter(), useSaveLetter()
 *
 * 인증/소유권:
 *   - 받은 편지의 수신자가 아닌 사용자가 접근 시 404
 *   - 서버 측 검증 필수
 */
type Props = {
  params: Promise<{ id: string }>;
};

export default async function LetterDetailPage({ params }: Props) {
  const { id } = await params;
  return <LetterDetailClient letterId={id} />;
}
