/**
 * Демонстраційні зображення для наповнення макета (Pexels, free-to-use).
 * У продакшні кожен URL замінюється на власний архівний матеріал платформи.
 * Імена захисників у мок-даних вигадані; портрети — стокові, лише для демо.
 */

const px = (id: number, w = 1600) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

export const MEDIA = {
  // Атмосфера / повноекранні сцени
  chapelCandles: px(54512),          // ряди свічок у каплиці
  cemeteryLanterns: px(29190174),    // лампадки на цвинтарі, вечір
  redCandles: px(29259348),          // ряди червоних лампадок
  winterGrave: px(6769909),          // засніжені лампадки
  framedPhoto: px(8871527),          // рамка з фото і свічки — «експонат»

  // Прапор / регіон
  flagSky: px(37032315),             // прапор проти неба
  odesaFlags: px(11543921),          // фасад в Одесі з прапорами
  crowdFlag: px(16058666),           // натовп із великим прапором

  // Хроніка / церемонії
  bwCeremony: px(29271687),          // ч/б церемонія військових
  march: px(15957199),               // урочистий марш

  // Архів / документи
  archiveTable: px(355713),          // старі листи й фотографії на столі
  lettersString: px(1157151),        // стос листів, перев’язаний мотузкою
  letterPhoto: px(5207503),          // листи поруч із ч/б фото

  // Демо-портрети (вигадані персонажі мок-даних)
  portraits: [px(2415939, 900), px(7468063, 900), px(10895248, 900), px(34730256, 900)],
} as const;

/** Детерміновано підібрати демо-портрет за PID. */
export function portraitFor(pid: string): string {
  let h = 0;
  for (let i = 0; i < pid.length; i++) h = (h * 31 + pid.charCodeAt(i)) >>> 0;
  return MEDIA.portraits[h % MEDIA.portraits.length]!;
}
