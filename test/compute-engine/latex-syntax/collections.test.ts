import { latex, parse } from '../../utils';

describe('LIST PARSING', () => {
  test('Empty list', () => {
    expect(parse('\\lbrack\\rbrack')).toMatchInlineSnapshot(`["List"]`);
    expect(parse('\\lbrack \\rbrack')).toMatchInlineSnapshot(`["List"]`);
  });

  test('One element list', () => {
    expect(parse('\\lbrack2\\rbrack')).toMatchInlineSnapshot(`["List", 2]`);
    expect(parse('\\lbrack x\\rbrack')).toMatchInlineSnapshot(`["List", "x"]`);
    expect(parse('\\lbrack x+1\\rbrack')).toMatchInlineSnapshot(
      `["List", ["Add", "x", 1]]`
    );
    expect(parse('\\lbrack x+1=0\\rbrack')).toMatchInlineSnapshot(
      `["List", ["Equal", ["Add", "x", 1], 0]]`
    );
  });

  test('Multi element list', () => {
    expect(parse('\\lbrack 1, 2\\rbrack')).toMatchInlineSnapshot(
      `["List", 1, 2]`
    );
    expect(parse('\\lbrack 2, y\\rbrack')).toMatchInlineSnapshot(
      `["List", 2, "y"]`
    );
    expect(parse('\\lbrack x+1=0, 2x^2+5=1\\rbrack')).toMatchInlineSnapshot(`
      [
        "List",
        ["Equal", ["Add", "x", 1], 0],
        ["Equal", ["Add", ["Multiply", 2, ["Square", "x"]], 5], 1]
      ]
    `);
  });

  test('Lists of lists', () => {
    expect(
      parse('\\lbrack \\lbrack 1, 2\\rbrack, \\lbrack 3, 4\\rbrack \\rbrack')
    ).toMatchInlineSnapshot(`["List", ["List", 1, 2], ["List", 3, 4]]`);
    expect(parse('\\lbrack 1, 2; 3, 4 \\rbrack')).toMatchInlineSnapshot(
      `["List", ["List", 1, 2], ["List", 3, 4]]`
    );
  });

  test('Matrix', () => {
    expect(parse('\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}'))
      .toMatchInlineSnapshot(`
      [
        "Error",
        ["ErrorCode", "'unknown-environment'", "'pmatrix'"],
        ["LatexString", "'\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}'"]
      ]
    `);
    expect(parse('\\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}'))
      .toMatchInlineSnapshot(`
      [
        "Error",
        ["ErrorCode", "'unknown-environment'", "'bmatrix'"],
        ["LatexString", "'\\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}'"]
      ]
    `);
  });
});

describe('LIST SERIALIZATION', () => {
  test('Empty list', () =>
    expect(latex('\\lbrack\\rbrack')).toMatchInlineSnapshot(
      `\\error{\\text{\\lbrack\\rbrack}}`
    ));
});
