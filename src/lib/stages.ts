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
  /** How many formula slots this stage allows. Most stages are solvable with one curve; a few intentionally require combining several. */
  maxFormulas: number;
}

export const STAGES: Stage[] = [
  {
    id: 'line',
    title: 'ステージ 1',
    drop: { x: -8, y: 9 },
    waypoints: [{ x: 3, y: -3 }],
    hint: '直線だけで届きます。例: y = -x - 1',
    maxFormulas: 1,
  },
  {
    id: 'parabola',
    title: 'ステージ 2',
    drop: { x: -8, y: 9 },
    waypoints: [
      { x: 0, y: -2 },
      { x: 7, y: 5 },
    ],
    hint: '放物線を使ってみましょう。例: y = 0.1*x^2 - 0.05*x - 3',
    maxFormulas: 1,
  },
  {
    id: 'valley',
    title: 'ステージ 3',
    drop: { x: -2, y: 9 },
    waypoints: [
      { x: -4, y: -3.4 },
      { x: 4, y: -3.4 },
    ],
    hint: '谷型の曲線が使えます。例: y = 0.1*x^2 - 4',
    maxFormulas: 1,
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
    hint: '陰関数（円）にも対応しています。例: x^2 + y^2 = 36',
    maxFormulas: 1,
  },
  {
    id: 'combo',
    title: 'ステージ 5',
    drop: { x: -9, y: 6 },
    waypoints: [
      { x: -5, y: -1.5 },
      { x: 1, y: -5.1 },
      { x: 8, y: -0.2 },
    ],
    hint: '複数の数式を組み合わせてみましょう。例: y = 0.1*x^2 - 0.2*x - 3',
    maxFormulas: 3,
  },
  {
    id: 'sideways-parabolas',
    title: 'ステージ 6',
    drop: { x: 2, y: 2 },
    waypoints: [
      { x: 1.5, y: 1.24 },
      { x: 0, y: -1.4 },
      { x: 5, y: -3.5 },
    ],
    hint: '横向きの放物線を2つ使います。例: x = y^2 と x = y^2/2 - 2',
    maxFormulas: 2,
  },
];
