import { parse } from '../../utils';

describe('BASIC PARSING', () => {
  test('', () => {
    expect(parse('')).toMatchInlineSnapshot(`["Sequence"]`);
    expect(parse('1')).toMatchInlineSnapshot(`1`);
    expect(parse('2{xy}')).toMatchInlineSnapshot(`["Multiply", 2, "x", "y"]`);
  });
});

describe('ADVANCED PARSING', () => {
  // Empty argument should not be interpreted as space group when argument is
  // expected
  test('\\frac{x}{} y', () =>
    expect(parse('\\frac{x}{} \\text{ cm}')).toMatchInlineSnapshot(
      `["Sequence", ["Divide", "x", ["Error", "'missing'"]], "' cm'"]`
    ));
});

describe('FUNCTIONS', () => {
  test('Multiple arguments', () =>
    expect(parse('\\gamma(2, 1)')).toMatchInlineSnapshot(`["gamma", 2, 1]`));
});

describe('UNKNOWN COMMANDS', () => {
  test('Parse', () => {
    expect(parse('\\foo')).toMatchInlineSnapshot(`
      [
        "Error",
        ["ErrorCode", "'unexpected-command'", "'\\foo'"],
        ["LatexString", "'\\foo'"]
      ]
    `);
    expect(parse('x=\\foo+1')).toMatchInlineSnapshot(`
      [
        "Add",
        [
          "Equal",
          "x",
          [
            "Error",
            ["ErrorCode", "'unexpected-command'", "'\\foo'"],
            ["LatexString", "'\\foo'"]
          ]
        ],
        1
      ]
    `);
    expect(parse('x=\\foo   {1}  {x+1}+1')).toMatchInlineSnapshot(`
      [
        "Add",
        [
          "Multiply",
          [
            "Equal",
            "x",
            [
              "Error",
              ["ErrorCode", "'unexpected-command'", "'\\foo'"],
              ["LatexString", "'\\foo{1}'"]
            ]
          ],
          ["Add", "x", 1]
        ],
        1
      ]
    `);
  });
});
