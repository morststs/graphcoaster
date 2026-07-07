export interface Point {
  x: number;
  y: number;
}

export interface Stage {
  id: string;
  title: string;
  drop: Point;
  waypoints: Point[];
  hint: string;
}

export const STAGES: Stage[] = [
  {
    id: 'line',
    title: 'ステージ 1',
    drop: { x: -8, y: 8 },
    waypoints: [{ x: 3, y: -3 }],
    hint: '直線だけで届きます。例: y = -x',
  },
  {
    id: 'parabola',
    title: 'ステージ 2',
    drop: { x: -8, y: 8 },
    waypoints: [
      { x: 0, y: -2 },
      { x: 7, y: 5 },
    ],
    hint: '放物線を使ってみましょう。例: y = 0.15*x^2 - 0.05*x - 2',
  },
  {
    id: 'valley',
    title: 'ステージ 3',
    drop: { x: -2, y: 9 },
    waypoints: [
      { x: -6, y: -1 },
      { x: 6, y: -1 },
    ],
    hint: '谷型の曲線が使えます。例: y = 0.1*x^2 - 5',
  },
  {
    id: 'circle',
    title: 'ステージ 4',
    drop: { x: -3, y: 9 },
    waypoints: [
      { x: -4.9, y: -4.9 },
      { x: 0, y: -7 },
      { x: 4.9, y: -4.9 },
    ],
    hint: '陰関数（円）にも対応しています。例: x^2 + y^2 = 49',
  },
  {
    id: 'combo',
    title: 'ステージ 5',
    drop: { x: -9, y: 6 },
    waypoints: [
      { x: -2, y: -5 },
      { x: 5, y: -2 },
      { x: 9, y: 4 },
    ],
    hint: '一つの数式では難しいかもしれません。複数の数式を組み合わせてみましょう。例: y = 0.06*x^2 - 0.4*x - 5',
  },
];
