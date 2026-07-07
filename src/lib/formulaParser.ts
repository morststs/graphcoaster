import { parse, derivative, type MathNode } from 'mathjs';

export class FormulaError extends Error {}

export interface ParsedExplicit {
  kind: 'explicit';
  yAt: (x: number) => number;
  slopeAt: (x: number) => number;
}

export interface ParsedImplicit {
  kind: 'implicit';
  F: (x: number, y: number) => number;
}

export type ParsedFormula = ParsedExplicit | ParsedImplicit;

const ALLOWED_NODE_TYPES = new Set([
  'OperatorNode',
  'FunctionNode',
  'SymbolNode',
  'ConstantNode',
  'ParenthesisNode',
]);

const ALLOWED_FUNCTIONS = new Set([
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
  'sinh', 'cosh', 'tanh',
  'sqrt', 'abs', 'pow', 'exp', 'log', 'log10', 'log2',
  'min', 'max', 'floor', 'ceil', 'round', 'sign', 'cbrt', 'hypot',
]);

const ALLOWED_SYMBOLS = new Set(['x', 'y', 'pi', 'e', 'tau']);
const SCOPE_CONSTANTS = { pi: Math.PI, e: Math.E, tau: 2 * Math.PI };

function validateNode(node: MathNode) {
  node.traverse((n: MathNode, path?: string) => {
    if (!ALLOWED_NODE_TYPES.has(n.type)) {
      throw new FormulaError(`使用できない構文です: ${n.type}`);
    }
    if (n.type === 'FunctionNode') {
      const name = (n as unknown as { fn?: { name?: string } }).fn?.name;
      if (!name || !ALLOWED_FUNCTIONS.has(name)) {
        throw new FormulaError(`使用できない関数です: ${name ?? '?'}`);
      }
    }
    if (n.type === 'SymbolNode' && path !== 'fn') {
      const name = (n as unknown as { name: string }).name;
      if (!ALLOWED_SYMBOLS.has(name)) {
        throw new FormulaError(`使用できない変数です: ${name}`);
      }
    }
  });
}

function containsSymbol(node: MathNode, target: string): boolean {
  let found = false;
  node.traverse((n: MathNode, path?: string) => {
    if (n.type === 'SymbolNode' && path !== 'fn' && (n as unknown as { name: string }).name === target) {
      found = true;
    }
  });
  return found;
}

export function parseFormula(raw: string): ParsedFormula {
  const text = raw.trim();
  if (!text) throw new FormulaError('数式を入力してください');
  if (/[<>]|==|!=/.test(text)) {
    throw new FormulaError('比較演算子は使用できません');
  }

  const eqIndex = text.indexOf('=');
  const lhsStr = eqIndex === -1 ? 'y' : text.slice(0, eqIndex).trim();
  const rhsStr = eqIndex === -1 ? text : text.slice(eqIndex + 1).trim();
  if (!lhsStr || !rhsStr) {
    throw new FormulaError('数式が不正です');
  }

  let lhsNode: MathNode;
  let rhsNode: MathNode;
  try {
    lhsNode = parse(lhsStr);
    rhsNode = parse(rhsStr);
  } catch {
    throw new FormulaError('数式を解析できませんでした');
  }
  validateNode(lhsNode);
  validateNode(rhsNode);

  const lhsIsBareY = lhsNode.type === 'SymbolNode' && (lhsNode as unknown as { name: string }).name === 'y';
  if (lhsIsBareY && !containsSymbol(rhsNode, 'y')) {
    return buildExplicit(rhsNode);
  }
  return buildImplicit(lhsNode, rhsNode);
}

function buildExplicit(rhsNode: MathNode): ParsedExplicit {
  const compiled = rhsNode.compile();
  const yAt = (x: number): number => {
    const v = compiled.evaluate({ x, ...SCOPE_CONSTANTS });
    return typeof v === 'number' ? v : NaN;
  };

  let symbolicSlope: ((x: number) => number) | null = null;
  try {
    const dCompiled = derivative(rhsNode, 'x').compile();
    symbolicSlope = (x: number) => {
      const v = dCompiled.evaluate({ x, ...SCOPE_CONSTANTS });
      return typeof v === 'number' ? v : NaN;
    };
  } catch {
    symbolicSlope = null;
  }

  const slopeAt = (x: number): number => {
    if (symbolicSlope) {
      const v = symbolicSlope(x);
      if (Number.isFinite(v)) return v;
    }
    const h = 1e-4;
    return (yAt(x + h) - yAt(x - h)) / (2 * h);
  };

  return { kind: 'explicit', yAt, slopeAt };
}

function buildImplicit(lhsNode: MathNode, rhsNode: MathNode): ParsedImplicit {
  const lhsCompiled = lhsNode.compile();
  const rhsCompiled = rhsNode.compile();
  const F = (x: number, y: number): number => {
    const scope = { x, y, ...SCOPE_CONSTANTS };
    const lv = lhsCompiled.evaluate(scope);
    const rv = rhsCompiled.evaluate(scope);
    if (typeof lv !== 'number' || typeof rv !== 'number') return NaN;
    return lv - rv;
  };
  return { kind: 'implicit', F };
}
