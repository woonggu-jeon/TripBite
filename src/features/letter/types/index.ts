export type LetterAuthor = {
  /** 닉네임. 미지정 시 서버가 "익명의 여행자" 반환 */
  nickname: string;
  /** 보낸 위치 (예: "충북 청주시"). 사용자 동의 기반 수집. */
  location?: string;
};

export type Letter = {
  id: string;
  body: string; // 1~5자
  author: LetterAuthor;
  arrivedAt: string; // ISO — 수신자 입장의 도착 시각
  createdAt: string; // ISO — 보낸 시각
  isMine: boolean; // 내가 보낸 편지 여부
  liked: boolean;
  saved: boolean;
  /** 좋아요 받은 수 (보낸 사람 입장에서 의미) */
  likeCount?: number;
  /**
   * 받은 편지 읽음 여부. 받은 편지 (isMine=false) 한정 의미.
   * undefined 는 legacy / 보낸 편지 — UI 에서 NEW 배지 노출 X.
   * 상세 진입 시 BE 가 자동 read 처리하거나 별도 mark-read endpoint 호출.
   */
  read?: boolean;
};

/** cursor 기반 페이지네이션 응답 */
export type LetterPage = {
  items: Letter[];
  nextCursor: number | null;
};

/** 편지 목록 종류 — 받은 / 보낸 / 좋아요 / 저장 (북마크) */
export type LetterListKind = 'received' | 'sent' | 'liked' | 'saved';

export type SendLetterRequest = {
  body: string; // 1~5자
  /**
   * 보낸 위치 — useResolveLocation 결과를 그대로 전달.
   * 미동의/실패 시 omit. 백엔드가 IP 기반 추론 또는 익명 처리.
   */
  location?: {
    label: string;
    regionCode?: string;
    latitude?: number;
    longitude?: number;
  };
  /**
   * 익명 발송 — true 면 서버가 author.nickname 을 가리고 "익명의 여행자" 처리.
   * 위치 정보는 그대로 전송 (지역만 노출, 닉네임만 가림).
   */
  isAnonymous?: boolean;
};
