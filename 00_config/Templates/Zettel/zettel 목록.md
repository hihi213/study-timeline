TABLE
  file.link AS "개념 노트",
  sr-due AS "다음 복습일",
  sr-interval AS "간격(일)",
  Level,
  LastReview AS "최근 복습일"
FROM #복습
SORT sr-due ASC

TABLE
  Level,
  LastReview as "마지막 복습",
  choice(
    Level = "🟥", date(LastReview) + dur(3 days),
    Level = "🟧", date(LastReview) + dur(7 days),
    Level = "🟩", date(LastReview) + dur(14 days),
    date(LastReview) + dur(1 day)
  ) as "예상 복습일"
FROM #복습