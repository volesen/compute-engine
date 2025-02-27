import { BoxedExpression } from '../../src/compute-engine/public';
import { engine } from '../utils';

function parse(expr: string): BoxedExpression {
  return engine.parse(expr)!;
}

describe('CALCULUS', () => {
  describe('D', () => {
    it('should compute the partial derivative of a polynomial', () => {
      const expr = parse('D(x^3 + 2x - 4, x)');
      const result = expr.evaluate();
      expect(result.latex).toMatchInlineSnapshot(`3x^2+2`);
    });

    it('should compute the partial derivative of a function with respect to a variable', () => {
      const expr = parse('D(x^2 + y^2, x)');
      const result = expr.evaluate();
      expect(result.latex).toMatchInlineSnapshot(`2x`);
    });

    it('should compute higher order partial derivatives', () => {
      const expr = parse('D(D(x^2 + y^2, x), x)');
      const result = expr.evaluate();
      expect(result.latex).toMatchInlineSnapshot(`2`);
    });

    it('should compute the partial derivative of a function with respect to a variable in a multivariable function with multiple variables', () => {
      const expr = parse('D(5x^3 + 7y^5 + 11z^{13}, x, x)');
      const result = expr.evaluate();
      expect(result.latex).toMatchInlineSnapshot(`30x`);
    });

    it('should compute the partial derivative of a function with respect to a variable in a multivariable function with multiple variables', () => {
      const expr = parse('D(x^2 + y^2 + z^2, x, y, z)');
      const result = expr.evaluate();
      expect(result.latex).toMatchInlineSnapshot(`0`);
    });

    it('should compute the partial derivative of a trigonometric function', () => {
      const expr = parse('D(\\sin(x), x)');
      const result = expr.evaluate();
      expect(result.latex).toMatchInlineSnapshot(`\\cos(x)`);
    });

    // \frac{2x+2}{x^2+2x}-\frac{\cos(\frac{1}{x})}{x^2}
    it('should compute a complex partial derivative', () => {
      const expr = parse('D(\\sin(\\frac{1}{x}) + \\ln(x^2+2x), x)');
      const result = expr.evaluate();
      expect(result.latex).toMatchInlineSnapshot(
        `\\frac{2x+2}{2x+x^2}-\\frac{\\cos(\\frac{1}{x})}{x^2}`
      );
    });
  });

  describe('Derivative', () => {
    it('should compute the derivative of a function', () => {
      const expr = parse('Derivative(Sin)');
      const result = expr.evaluate();
      expect(result.latex).toMatchInlineSnapshot(`D\\error{\\texttt{e}}`);
    });

    it('should compute higher order derivatives', () => {
      const expr = parse('Derivative(Function(Square(x), x), 2)');
      const result = expr.evaluate();
      expect(result.latex).toMatchInlineSnapshot(`D\\error{\\texttt{e}}`);
    });

    it('should compute the derivative of a function with respect to a specific variable', () => {
      const expr = parse('Derivative(Function(Add(x, y), x, y), 0, 1)');
      const result = expr.evaluate();
      expect(result.latex).toMatchInlineSnapshot(`D\\error{\\texttt{e}}`);
    });
  });
});
