import { rawExpression } from '../../utils';

describe('NO DICTIONARY/NO DEFAULTS', () => {
  test('Parsing', () => {
    expect(rawExpression('')).toMatchInlineSnapshot(`'"Nothing"'`);
    expect(rawExpression('1+x')).toMatchInlineSnapshot(
      `'["Sequence",1,["Error",["ErrorCode","'unexpected-token'","'+'"],["Latex","'+x'"]]]'`
    );
    expect(rawExpression('x^2')).toMatchInlineSnapshot(`'"x"'`);
    expect(rawExpression('\\frac{1}{x}')).toMatchInlineSnapshot(
      `'["Sequence","\\\\frac",["Error",["ErrorCode","'unexpected-token'","'{'"],["Latex","'{1}{x}'"]]]'`
    );
    expect(
      rawExpression('\\sqrt{(1+x_0)}=\\frac{\\pi^2}{2}')
    ).toMatchInlineSnapshot(
      `'["Sequence","\\\\sqrt",["Error",["ErrorCode","'unexpected-token'","'{'"],["Latex","'{(1+x_0)}=\\\\frac{\\\\pi^2}{2}'"]]]'`
    );
  });
});
