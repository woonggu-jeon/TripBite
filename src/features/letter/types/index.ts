export type LetterAuthor = {
  /** 닉네임. 미지정 시 서버가 "익명의 여행자" 반환 */
  nickname: string;
  /** 보낸 위치 (예: "충북 청주시"). 사용자 동의 기반 수집. */
  location?: string;
};

export type Letter = {
  id: string;
  body: string;            // 1~5자
  author: LetterAuthor;
  arrivedAt: string;       // ISO — 수신자 입장의 도착 시각
  createdAt: string;       // ISO — 보낸 시각
  isMine: boolean;         // 내가 보낸 편지 여부
  liked: boolean;
  saved: boolean;
  /** 좋아요 받은 수 (보낸 사람 입장에서 의미) */
  likeCount?: number;
};

export type SendLetterRequest = {
  body: string; // 1~5자
};
