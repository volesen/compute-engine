import { check, checkJson, engine } from '../utils';

engine.jsonSerializationOptions = { precision: 20 };
const ce = engine;

describe('CONSTANTS', () => {
  test(`ExponentialE`, () =>
    expect(checkJson(`ExponentialE`)).toMatchSnapshot());
  test(`ImaginaryUnit`, () =>
    expect(checkJson(`ImaginaryUnit`)).toMatchSnapshot());
  test(`MachineEpsilon`, () =>
    expect(checkJson(`MachineEpsilon`)).toMatchSnapshot());
  test(`CatalanConstant`, () =>
    expect(checkJson(`CatalanConstant`)).toMatchSnapshot());
  test(`GoldenRatio`, () => expect(checkJson(`GoldenRatio`)).toMatchSnapshot());
  test(`EulerGamma`, () => expect(checkJson(`EulerGamma`)).toMatchSnapshot());
});

describe('RELATIONAL OPERATOR', () => {
  test(`Equal`, () =>
    expect(ce.box(['Equal', 5, 5]).evaluate()).toMatchSnapshot());
  test(`Equal`, () =>
    expect(ce.box(['Equal', 11, 7]).evaluate()).toMatchSnapshot());
  test(`NotEqual`, () =>
    expect(ce.box(['NotEqual', 5, 5]).evaluate()).toMatchSnapshot());
  test(`NotEqual`, () =>
    expect(ce.box(['NotEqual', 11, 7]).evaluate()).toMatchSnapshot());
  test(`Greater`, () =>
    expect(ce.box(['Greater', 3, 19]).evaluate()).toMatchSnapshot());
  test(`Greater`, () =>
    expect(ce.box(['Greater', 2.5, 1.1]).evaluate()).toMatchSnapshot());
  test(`Less`, () =>
    expect(ce.box(['Less', 3, 19]).evaluate()).toMatchSnapshot());
  test(`Less`, () =>
    expect(ce.box(['Less', 2.5, 1.1]).evaluate()).toMatchSnapshot());
  test(`GreaterEqual`, () =>
    expect(ce.box(['GreaterEqual', 3, 3]).evaluate()).toMatchSnapshot());
  test(`GreaterEqual`, () =>
    expect(ce.box(['GreaterEqual', 3, 19]).evaluate()).toMatchSnapshot());
  test(`GreaterEqual`, () =>
    expect(ce.box(['GreaterEqual', 2.5, 1.1]).evaluate()).toMatchSnapshot());
  test(`LessEqual`, () =>
    expect(ce.box(['LessEqual', 3, 3]).evaluate()).toMatchSnapshot());
  test(`LessEqual`, () =>
    expect(ce.box(['LessEqual', 3, 19]).evaluate()).toMatchSnapshot());
  test(`LessEqual`, () =>
    expect(ce.box(['LessEqual', 2.5, 1.1]).evaluate()).toMatchSnapshot());
});

//
// When using `.evaluate()` if there are any non-exact arguments (literal
// numbers with fractional part), the result is an approximation (same as
// `N()`). Otherwise, if all the arguments are exact they are grouped as follow:
// - integers
// - rationals
// - square root of rationals
// - functions (trig, etc...)
// - constants
//
//
describe('EXACT EVALUATION', () => {
  test(`Sqrt: Exact integer`, () =>
    expect(check('\\sqrt{5}')).toMatchSnapshot());
  test(`Sqrt: Exact rational`, () =>
    expect(check('\\sqrt{\\frac{5}{7}}')).toMatchSnapshot());
  test(`Sqrt: Inexact Fractional part`, () =>
    expect(check('\\sqrt{5.1}')).toMatchSnapshot());

  test(`Cos: Exact integer`, () => expect(check('\\cos{5}')).toMatchSnapshot());

  test(`Cos: Exact rational`, () =>
    expect(check('\\cos{\\frac{5}{7}}')).toMatchSnapshot());
  test(`Cos: Inexact Fractional part`, () =>
    expect(check('\\cos(5.1)')).toMatchSnapshot());
  test(`Cos: Pi (simplify constructible value)`, () =>
    expect(check('\\cos{\\pi}')).toMatchSnapshot());

  test(`Add: All exact`, () =>
    expect(check('6+\\frac{10}{14}+\\sqrt{\\frac{18}{9}}')).toMatchSnapshot());

  test(`Add: All exact`, () =>
    expect(check('6+\\sqrt{2}+\\sqrt{5}')).toMatchSnapshot());

  test(`Add: All exact`, () =>
    expect(
      check('2+5+\\frac{5}{7}+\\frac{7}{9}+\\sqrt{2}+\\pi')
    ).toMatchSnapshot());
  test(`Add: one inexact`, () =>
    expect(
      check('1.1+2+5+\\frac{5}{7}+\\frac{7}{9}+\\sqrt{2}+\\pi')
    ).toMatchSnapshot());
});

describe('ADD', () => {
  test(`Add ['Add']`, () =>
    expect(ce.box(['Add']).evaluate()).toMatchSnapshot());

  test(`Add ['Add', 2.5]`, () =>
    expect(ce.box(['Add', 2.5]).evaluate()).toMatchSnapshot());

  test(`Add ['Add', 2.5, -1.1]`, () =>
    expect(ce.box(['Add', 2.5, -1.1]).evaluate()).toMatchSnapshot());
  test(`Add ['Add', 2.5, -1.1, 18.4]`, () =>
    expect(ce.box(['Add', 2.5, -1.1, 18.4]).evaluate()).toMatchSnapshot());

  test(`Add \\frac{2}{-3222233}+\\frac{1}{3}`, () =>
    expect(check('\\frac{2}{-3222233}+\\frac{1}{3}')).toMatchSnapshot());

  test(`Add `, () =>
    expect(
      check(
        '2+4+1.5+1.7+\\frac{5}{7}+\\frac{3}{11}+\\sqrt{5}+\\pi+\\sqrt{5}+\\sqrt{4}'
      )
    ).toMatchSnapshot());

  // Expected result: 12144966884186830401015120518973257/150534112785803114146067001510798 = 80.6792
  test(`Add '\\frac{2}{3}+\\frac{12345678912345678}{987654321987654321}+\\frac{987654321987654321}{12345678912345678}'`, () =>
    expect(
      check(
        '\\frac{2}{3}+\\frac{12345678912345678}{987654321987654321}+\\frac{987654321987654321}{12345678912345678}'
      )
    ).toMatchSnapshot());
});
describe('Subtract', () => {
  test(`Subtract`, () =>
    expect(ce.box(['Subtract', 2.5]).evaluate()).toMatchSnapshot());
  test(`Subtract`, () =>
    expect(ce.box(['Subtract', 2.5, 1.1]).evaluate()).toMatchSnapshot());
  test(`INVALID Subtract`, () =>
    expect(ce.box(['Subtract', 2.5, -1.1, 18.4]).evaluate()).toMatchSnapshot());
});

describe('NEGATE', () => {
  test(`-2`, () => expect(checkJson(['Negate', 2])).toMatchSnapshot());
  test(`-0`, () => expect(checkJson(['Negate', 0])).toMatchSnapshot());
  test(`-(-2.1)`, () => expect(checkJson(['Negate', -2])).toMatchSnapshot());
  test(`-2.5`, () => expect(checkJson(['Negate', 2.5])).toMatchSnapshot());

  test(`-NaN`, () => expect(checkJson(['Negate', 'NaN'])).toMatchSnapshot());

  test(`-(+Infinity)`, () =>
    expect(checkJson(['Negate', { num: '+Infinity' }])).toMatchSnapshot());
  test(`-(-Infinity)`, () =>
    expect(checkJson(['Negate', { num: '-Infinity' }])).toMatchSnapshot());

  test(`-1234567890987654321`, () =>
    expect(
      checkJson(['Negate', { num: '1234567890987654321' }])
    ).toMatchSnapshot());

  test(`-1234567890987654321.123456789`, () =>
    expect(
      checkJson(['Negate', '1234567890987654321.123456789'])
    ).toMatchSnapshot());

  test(`-(1+i)`, () =>
    expect(checkJson(['Negate', ['Complex', 1, 1]])).toMatchSnapshot());

  test(`-(1.1+1.1i)`, () =>
    expect(checkJson(['Negate', ['Complex', 1.1, 1.1]])).toMatchSnapshot());

  test(`-(1.1i)`, () =>
    expect(checkJson(['Negate', ['Complex', 0, 1.1]])).toMatchSnapshot());

  test(`-(1.1+i)`, () =>
    expect(checkJson(['Negate', ['Complex', 1.1, 1]])).toMatchSnapshot());
  test(`-(1+1.1i)`, () =>
    expect(checkJson(['Negate', ['Complex', 1, 1.1]])).toMatchSnapshot());

  test(`-(2/3)`, () =>
    expect(checkJson(['Negate', ['Rational', 2, 3]])).toMatchSnapshot());

  test(`-(-2/3)`, () =>
    expect(checkJson(['Negate', ['Rational', -2, 3]])).toMatchSnapshot());

  test(`-(1234567890987654321/3)`, () =>
    expect(
      checkJson(['Negate', ['Rational', { num: '1234567890987654321' }, 3]])
    ).toMatchSnapshot());
});

describe('INVALID NEGATE', () => {
  test(`INVALID Negate`, () =>
    expect(ce.box(['Negate', 2.5, 1.1]).evaluate()).toMatchSnapshot());
  test(`INVALID Negate`, () =>
    expect(ce.box(['Negate', 2.5, -1.1, 18.4]).evaluate()).toMatchSnapshot());
});

describe('MULTIPLY', () => {
  test(`Multiply`, () =>
    expect(checkJson(['Multiply', 2.5])).toMatchSnapshot());

  test(`5x2`, () => expect(checkJson(['Multiply', 5, 2])).toMatchSnapshot());

  test(`5x(-2.1)`, () =>
    expect(checkJson(['Multiply', 5, -2.1])).toMatchSnapshot());

  test(`with zero`, () =>
    expect(checkJson(['Multiply', 'x', 2, 3.1, 0])).toMatchSnapshot());
  test(`with NaN`, () =>
    expect(checkJson(['Multiply', 'x', 2, 3.1, 'NaN'])).toMatchSnapshot());
  test(`with <0`, () =>
    expect(checkJson(['Multiply', 'x', -2, 3.1, -5.2])).toMatchSnapshot());

  test(`with +Infinity`, () =>
    expect(
      checkJson(['Multiply', 'x', -2, 3.1, { num: '+Infinity' }])
    ).toMatchSnapshot());

  test(`with -Infinity`, () =>
    expect(
      checkJson(['Multiply', 'x', -2, 3.1, { num: '-Infinity' }])
    ).toMatchSnapshot());

  test(`with -Infinity and +Infinity`, () =>
    expect(
      checkJson([
        'Multiply',
        'x',
        -2,
        3.1,
        { num: '-Infinity' },
        { num: '+Infinity' },
      ])
    ).toMatchSnapshot());

  test(`2x1234567890987654321`, () =>
    expect(
      checkJson(['Multiply', 2, { num: '1234567890987654321' }])
    ).toMatchSnapshot());

  test(`2x-1234567890987654321.123456789`, () =>
    expect(
      checkJson(['Multiply', 2, '1234567890987654321.123456789'])
    ).toMatchSnapshot());

  test(`2x(1+i)`, () =>
    expect(checkJson(['Multiply', 2, ['Complex', 1, 1]])).toMatchSnapshot()); // @fixme should be NaN for mach, big

  test(`2x(1.1+1.1i)`, () =>
    expect(
      checkJson(['Multiply', 2, ['Complex', 1.1, 1.1]])
    ).toMatchSnapshot());

  test(`2x(1.1i)`, () =>
    expect(checkJson(['Multiply', 2, ['Complex', 0, 1.1]])).toMatchSnapshot());

  test(`2x(1.1+i)`, () =>
    expect(checkJson(['Multiply', 2, ['Complex', 1.1, 1]])).toMatchSnapshot());
  test(`2x(1+1.1i)`, () =>
    expect(checkJson(['Multiply', 2, ['Complex', 1, 1.1]])).toMatchSnapshot());

  test(`2x(2/3)`, () =>
    expect(checkJson(['Multiply', 2, ['Rational', 2, 3]])).toMatchSnapshot());
  test(`2x(-2/3)`, () =>
    expect(checkJson(['Multiply', 2, ['Rational', -2, 3]])).toMatchSnapshot());
  test(`2x(1234567890987654321/3)`, () =>
    expect(
      checkJson([
        'Multiply',
        2,
        ['Rational', { num: '1234567890987654321' }, 3],
      ])
    ).toMatchSnapshot());

  test(`Multiply`, () =>
    expect(checkJson(['Multiply', 2.5, 1.1])).toMatchSnapshot());
  test(`Multiply`, () =>
    expect(checkJson(['Multiply', 2.5, -1.1, 18.4])).toMatchSnapshot());

  test(`Multiply: All exact`, () =>
    expect(check('2\\frac{5}{7}\\times\\frac{7}{9}')).toMatchSnapshot());

  test(`Multiply: All exact`, () =>
    expect(
      check(
        '2\\times 5\\times\\frac{5}{7}\\times\\frac{7}{9}\\times\\sqrt{2}\\times\\pi'
      )
    ).toMatchSnapshot());
  test(`Multiply: One inexact`, () =>
    expect(
      check(
        '1.1\\times 2\\times 5\\times\\frac{5}{7}\\times\\frac{7}{9}\\times\\sqrt{2}\\times\\pi'
      )
    ).toMatchSnapshot()); // @fixme eval-big should be same or bettern than evaluate
});

describe('Divide', () => {
  test(`INVALID  Divide`, () =>
    expect(ce.box(['Divide', 2.5]).evaluate()).toMatchSnapshot());
  test(`Divide`, () =>
    expect(ce.box(['Divide', 6, 3]).evaluate()).toMatchSnapshot());
  test(`Divide`, () =>
    expect(ce.box(['Divide', 2.5, 1.1]).evaluate()).toMatchSnapshot());
  test(`INVALID Divide`, () =>
    expect(ce.box(['Divide', 2.5, -1.1, 18.4]).evaluate()).toMatchSnapshot());
});

describe('Power', () => {
  test(`INVALID Power`, () =>
    expect(ce.box(['Power', 2.5]).evaluate()).toMatchSnapshot());
  test(`Power`, () =>
    expect(ce.box(['Power', 2.5, 1.1]).evaluate()).toMatchSnapshot());
  test(`Power`, () =>
    expect(ce.box(['Power', 2.5, -3]).evaluate()).toMatchSnapshot());
  test(`Power`, () =>
    expect(ce.box(['Power', 2.5, -3.2]).evaluate()).toMatchSnapshot());
  test(`INVALID Power`, () =>
    expect(ce.box(['Power', 2.5, -1.1, 18.4]).evaluate()).toMatchSnapshot());
});

describe('Root', () => {
  test(`Root 2.5`, () =>
    expect(ce.box(['Root', 2.5, 3]).evaluate()).toMatchSnapshot());

  test(`Root 5/7`, () =>
    expect(
      ce.box(['Root', ['Rational', 5, 7], 3]).evaluate()
    ).toMatchSnapshot());

  test(`Root 1234567890987654321`, () =>
    expect(
      ce.box(['Root', { num: '1234567890987654321' }, 3]).evaluate()
    ).toMatchSnapshot());

  test(`Root 1234567890987654321.123456789`, () =>
    expect(
      ce.box(['Root', { num: '1234567890987654321.123456789' }, 3]).evaluate()
    ).toMatchSnapshot());
});

describe('INVALID ROOT', () => {
  test(`Too few args`, () =>
    expect(ce.box(['Root', 2.5]).evaluate()).toMatchSnapshot());
  test(`Too many args`, () =>
    expect(ce.box(['Root', 2.5, -1.1, 18.4]).evaluate()).toMatchSnapshot());
});

describe('Sqrt', () => {
  test(`√0`, () => expect(checkJson(['Sqrt', 0])).toMatchSnapshot());

  test(`√2.5`, () => {
    expect(checkJson(['Sqrt', 2.5])).toMatchSnapshot();
  });

  test(`√(175)`, () => expect(checkJson(['Sqrt', 175])).toMatchSnapshot());

  test(`√(12345670000000000000000000)`, () =>
    expect(
      checkJson(['Sqrt', { num: '12345670000000000000000000' }])
    ).toMatchSnapshot());

  test(`√(5/7)`, () =>
    expect(checkJson(['Sqrt', ['Rational', 5, 7]])).toMatchSnapshot());

  // √12345678901234567890 = 3 x √1371742100137174210
  test(`√12345678901234567890`, () =>
    expect(
      checkJson(['Sqrt', { num: '12345678901234567890' }])
    ).toMatchSnapshot());

  test(`√123456789.01234567890`, () =>
    expect(
      checkJson(['Sqrt', { num: '123456789.01234567890' }])
    ).toMatchSnapshot());

  test(`√(1000000/49)`, () =>
    expect(checkJson(['Sqrt', ['Rational', 1000000, 49]])).toMatchSnapshot());

  test(`√(1000001/7)`, () =>
    expect(checkJson(['Sqrt', ['Rational', 1000001, 7]])).toMatchSnapshot());

  test(`√(12345678901234567890/23456789012345678901)`, () =>
    expect(
      checkJson([
        'Sqrt',
        [
          'Rational',
          { num: '12345678901234567890' },
          { num: '23456789012345678901' },
        ],
      ])
    ).toMatchSnapshot());

  test(`√(3+4i)`, () =>
    expect(checkJson(['Sqrt', ['Complex', 3, 4]])).toMatchSnapshot());

  test(`√(4x)`, () =>
    expect(checkJson(['Sqrt', ['Multiply', 4, 'x']])).toMatchSnapshot());

  test(`√(3^2)`, () =>
    expect(checkJson(['Sqrt', ['Square', 3]])).toMatchSnapshot());

  test(`√(5x(3+2))`, () =>
    expect(
      checkJson(['Sqrt', ['Multiply', 5, ['Add', 3, 2]]])
    ).toMatchSnapshot());

  test(`INVALID Sqrt`, () =>
    expect(checkJson(['Sqrt', 2.5, 1.1])).toMatchSnapshot());
  test(`INVALID  Sqrt`, () =>
    expect(checkJson(['Sqrt', 2.5, -1.1, 18.4])).toMatchSnapshot());
});

describe('Square', () => {
  test(`Square`, () => expect(checkJson(['Square', 2.5])).toMatchSnapshot());
  test(`INVALID Square`, () =>
    expect(checkJson(['Square', 2.5, 1.1])).toMatchSnapshot());
  test(`INVALID Square`, () =>
    expect(checkJson(['Square', 2.5, -1.1, 18.4])).toMatchSnapshot());
});

describe('Max', () => {
  test(`Max`, () => expect(checkJson(['Max', 2.5])).toMatchSnapshot());
  test(`Max`, () => expect(checkJson(['Max', 2.5, 1.1])).toMatchSnapshot());
  test(`Max`, () =>
    expect(checkJson(['Max', 2.5, -1.1, 18.4])).toMatchSnapshot());
  test(`Max`, () =>
    expect(checkJson(['Max', 2.5, -1.1, 'NaN', 18.4])).toMatchSnapshot());
  test(`Max`, () =>
    expect(checkJson(['Max', 2.5, -1.1, 'foo', 18.4])).toMatchSnapshot());
  test(`Max`, () => expect(checkJson(['Max', 'foo', 'bar'])).toMatchSnapshot());
});

describe('Min', () => {
  test(`Min`, () => expect(checkJson(['Min', 2.5])).toMatchSnapshot());
  test(`Min`, () => expect(checkJson(['Min', 2.5, 1.1])).toMatchSnapshot());
  test(`Min`, () =>
    expect(checkJson(['Min', 2.5, -1.1, 18.4])).toMatchSnapshot());
  test(`Min`, () =>
    expect(checkJson(['Min', 2.5, -1.1, 'NaN', 18.4])).toMatchSnapshot());
  test(`Min`, () =>
    expect(checkJson(['Min', 2.5, -1.1, 'foo', 18.4])).toMatchSnapshot());
  test(`Min`, () => expect(checkJson(['Min', 'foo', 'bar'])).toMatchSnapshot());
});

describe('Rational', () => {
  test(`Rational`, () =>
    expect(checkJson(['Rational', 3, 4])).toMatchSnapshot());

  test(`Bignum rational`, () =>
    expect(
      checkJson([
        'Rational',
        { num: '12345678901234567890' },
        { num: '23456789012345678901' },
      ])
    ).toMatchSnapshot());

  test(`INVALID Rational`, () => {
    expect(checkJson(['Rational', 2.5, -1.1, 18.4])).toMatchSnapshot();
    expect(checkJson(['Rational', 2, 3, 5])).toMatchSnapshot();
  });
  test(`Rational as Divide`, () =>
    expect(checkJson(['Rational', 3.1, 2.8])).toMatchSnapshot());
  test(`Rational approximation`, () =>
    expect(checkJson(['Rational', 2.5])).toMatchSnapshot());
  test(`Rational approximation`, () =>
    expect(checkJson(['Rational', 'Pi'])).toMatchSnapshot());
});

describe('Ln', () => {
  expect(checkJson(['Ln', 1.1])).toMatchSnapshot();
  expect(checkJson(['Ln', 1])).toMatchSnapshot();
  expect(checkJson(['Ln', 0])).toMatchSnapshot();
  expect(checkJson(['Ln', -1])).toMatchSnapshot();
  expect(checkJson(['Ln', 'Pi'])).toMatchSnapshot();
  expect(checkJson(['Ln', ['Complex', 1.1, 1.1]])).toMatchSnapshot();
});

describe('Lb', () => {
  expect(checkJson(['Lb', 1.1])).toMatchSnapshot();
  expect(checkJson(['Lb', 1])).toMatchSnapshot();
  expect(checkJson(['Lb', 0])).toMatchSnapshot();
  expect(checkJson(['Lb', -1])).toMatchSnapshot();
  expect(checkJson(['Lb', 'Pi'])).toMatchSnapshot();
  expect(checkJson(['Lb', ['Complex', 1.1, 1.1]])).toMatchSnapshot();
});

describe('Lg', () => {
  expect(checkJson(['Lg', 1.1])).toMatchSnapshot();
  expect(checkJson(['Lg', 1])).toMatchSnapshot();
  expect(checkJson(['Lg', 0])).toMatchSnapshot();
  expect(checkJson(['Lg', -1])).toMatchSnapshot();
  expect(checkJson(['Lg', 'Pi'])).toMatchSnapshot();
  expect(checkJson(['Lg', ['Complex', 1.1, 1.1]])).toMatchSnapshot();
});

describe('Log(a,b)', () => {
  expect(checkJson(['Log', 1.1])).toMatchSnapshot();
  expect(checkJson(['Log', 1])).toMatchSnapshot();
  expect(checkJson(['Log', 0])).toMatchSnapshot();
  expect(checkJson(['Log', -1])).toMatchSnapshot();
  expect(checkJson(['Log', 'Pi'])).toMatchSnapshot();
  expect(checkJson(['Log', ['Complex', 1.1, 1.1]])).toMatchSnapshot();

  expect(checkJson(['Log', 1.1, 5])).toMatchSnapshot();
  expect(checkJson(['Log', 1, 5])).toMatchSnapshot();
  expect(checkJson(['Log', 0, 5])).toMatchSnapshot();
  expect(checkJson(['Log', -1, 5])).toMatchSnapshot();
  expect(checkJson(['Log', 'Pi', 5])).toMatchSnapshot();
  expect(checkJson(['Log', ['Complex', 1.1, 1.1], 5])).toMatchSnapshot();
});

describe('Log Invalid', () => {
  expect(checkJson(['Ln'])).toMatchSnapshot();
  expect(checkJson(['Ln', "'string'"])).toMatchSnapshot();
  expect(checkJson(['Ln', 3, 4])).toMatchSnapshot();
});

describe('Limit', () => {
  expect(
    ce
      .box(['Limit', ['Function', ['Divide', ['Sin', 'x'], 'x'], 'x'], 0])
      .evaluate()
      .valueOf()
  ).toMatchInlineSnapshot(
    `["Limit",["Function",["Divide",["Sin","x"],"x"],"x"],0]`
  );

  expect(
    ce
      .box(['Limit', ['Function', ['Divide', ['Sin', 'x'], 'x'], 'x'], 0])
      .N()
      .valueOf()
  ).toMatchInlineSnapshot(`1`);

  expect(
    ce
      .box(['NLimit', ['Function', ['Divide', ['Sin', 'x'], 'x'], 'x'], 0])
      .evaluate()
      .valueOf()
  ).toMatchInlineSnapshot(`1`);

  expect(
    ce
      .box(['NLimit', ['Divide', ['Sin', '_'], '_'], 0])
      .evaluate()
      .valueOf()
  ).toMatchInlineSnapshot(`1`);

  // Should be "1"
  expect(
    ce
      .box([
        'NLimit',
        ['Function', ['Cos', ['Divide', 1, 'x']], 'x'],
        'Infinity',
      ])
      .evaluate()
      .valueOf()
  ).toMatchInlineSnapshot(`1`);
});
