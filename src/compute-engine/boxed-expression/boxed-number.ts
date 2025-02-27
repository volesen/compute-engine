import { Complex } from 'complex.js';
import { Decimal } from 'decimal.js';
import { Expression } from '../../math-json/math-json-format';
import {
  BoxedExpression,
  BoxedDomain,
  IComputeEngine,
  Metadata,
  NOptions,
  PatternMatchOptions,
  Rational,
  SimplifyOptions,
  BoxedSubstitution,
  EvaluateOptions,
} from '../public';
import { inferNumericDomain } from '../domain-utils';
import { isInMachineRange } from '../numerics/numeric-bignum';
import { isPrime } from '../numerics/primes';
import {
  isBigRational,
  isRational,
  isRationalNegativeOne,
  isRationalOne,
  reducedRational,
  signDiff,
} from '../numerics/rationals';

import { _BoxedExpression } from './abstract-boxed-expression';
import { serializeJsonNumber } from './serialize';
import { hashCode, bignumPreferred } from './utils';

/**
 * BoxedNumber
 */

export class BoxedNumber extends _BoxedExpression {
  protected readonly _value: number | Decimal | Complex | Rational;
  private _domain: BoxedDomain | undefined;
  private _hash: number | undefined;

  protected _isCanonical: boolean;

  /**
   * By the time the constructor is called, the `value` should have been
   * screened for cases where it's a well-known value (0, NaN, +Infinity,
   * etc...) or non-normal (complex number with im = 0, rational with
   * denom = 1, etc...).
   *
   * This is done in `ce.number()`. In general, use `ce.number()` rather
   * than calling this constructor directly.
   *
   * We may store as a machine number if a Decimal is passed that is in machine
   * range
   */
  constructor(
    ce: IComputeEngine,
    value: number | Decimal | Complex | Rational,
    options?: { metadata?: Metadata; canonical?: boolean }
  ) {
    super(ce, options?.metadata);
    if (typeof value === 'number') {
      this._value = value;
      this._isCanonical = true;
      return;
    }
    if (isRational(value)) {
      //
      // This is a rational (or big rational)
      //
      const [n, d] = value;
      console.assert(
        typeof n !== 'number' ||
          (Number.isInteger(n) && Number.isInteger(d) && d !== n && d !== 1)
      );
      console.assert(
        !(typeof n === 'bigint' && typeof d == 'bigint') ||
          (d !== n && d !== BigInt(1))
      );

      if (options?.canonical ?? true) {
        this._value = canonicalNumber(ce, value);
        this._isCanonical = true;
      } else {
        this._value = value;
        // Note: it *could* be already canonical, but we don't
        // bother checking as it could be expensive and might
        // not be worthwhile
        this._isCanonical = false;
      }
    } else {
      console.assert(
        !(value instanceof Complex) ||
          (!Number.isNaN(value.re) &&
            !Number.isNaN(value.im) &&
            ce.chop(value.im) !== 0)
      );
      // Any non-rational is already in canonical form
      // but we downconvert decimal to number when possible
      this._value = canonicalNumber(ce, value);
      this._isCanonical = true;
    }
  }

  get hash(): number {
    if (this._hash !== undefined) return this._hash;
    let h = 0;
    if (typeof this._value === 'number') h = hashCode(this._value.toString());
    else if (this._value instanceof Complex)
      h = hashCode(
        this._value.re.toString() + ' +i ' + this._value.im.toString()
      );
    else if (this._value instanceof Decimal)
      h = hashCode(this._value.toString());
    else
      h = hashCode(
        this._value[0].toString() + ' / ' + this._value[1].toString()
      );
    this._hash = h;
    return h;
  }

  get head(): string {
    return 'Number';
  }

  get isPure(): boolean {
    return true;
  }

  get isExact(): boolean {
    if (typeof this._value === 'number') return Number.isInteger(this._value);
    if (this._value instanceof Decimal) return this._value.isInteger();
    if (this._value instanceof Complex)
      return (
        Number.isInteger(this._value.re) && Number.isInteger(this._value.im)
      );
    return isRational(this._value);
  }

  get isCanonical(): boolean {
    return this._isCanonical;
  }
  set isCanonical(val: boolean) {
    this._isCanonical = val;
  }

  get complexity(): number {
    return 1;
  }

  get value(): BoxedExpression {
    return this;
  }

  get numericValue(): number | Decimal | Complex | Rational {
    return this._value;
  }

  get domain(): BoxedDomain {
    this._domain ??= this.engine.domain(inferNumericDomain(this._value));
    return this._domain;
  }

  get json(): Expression {
    return serializeJsonNumber(this.engine, this._value, {
      latex: this._latex,
    });
  }

  get sgn(): -1 | 0 | 1 | undefined | null {
    if (this._value === 0) return 0;

    if (typeof this._value === 'number') {
      if (this._value < 0) return -1;
      if (this._value > 0) return 1;
      return null;
    }

    if (this._value instanceof Decimal) {
      if (this._value.isZero()) return 0;
      if (this._value.isNegative()) return -1;
      if (this._value.isPositive()) return 1;
      return null;
    }

    if (Array.isArray(this._value)) {
      // By convention, the denominator is always positive,
      // so the sign is carried by the numerator
      const [numer, denom] = this._value;
      // Since the ===, < and > operator are defined for both
      // number and bigint, no need to check the type
      if (numer === 0 && denom !== 0) return 0;
      if (numer < 0) return -1;
      if (numer > 0) return 1;
      return null;
    }

    // if (this._value instanceof Complex) return null;

    return null;
  }

  isSame(rhs: BoxedExpression): boolean {
    if (this === rhs) return true;
    if (!(rhs instanceof BoxedNumber)) return false;

    if (typeof this._value === 'number') {
      if (typeof rhs._value !== 'number') return false;
      return this._value === rhs._value;
    }

    if (this._value instanceof Decimal) {
      if (!(rhs._value instanceof Decimal)) return false;
      return this._value.eq(rhs._value);
    }

    if (Array.isArray(this._value)) {
      if (!Array.isArray(rhs._value)) return false;
      const [rhsN, rhsD] = rhs._value;
      return this._value[0] === rhsN && this._value[1] === rhsD;
    }

    if (this._value instanceof Complex) {
      if (!(rhs._value instanceof Complex)) return false;
      return this._value.equals(rhs._value);
    }

    return false;
  }

  isEqual(rhs: BoxedExpression): boolean {
    // Note: this is not the same as `isSame()`: we want 0.09 and [9,100]
    // to be considered equal.
    if (this === rhs) return true;
    if (!(rhs instanceof BoxedNumber)) return false;
    const s = signDiff(this, rhs);
    return s === 0;
  }

  match(
    rhs: BoxedExpression,
    options?: PatternMatchOptions
  ): BoxedSubstitution | null {
    if (this.isEqualWithTolerance(rhs, options?.numericTolerance ?? 0))
      return {};
    return null;
  }

  /** Compare this with another BoxedNumber.
   * `rhs` must be a BoxedNumber. Use `isEqualWithTolerance(rhs.N())`
   * if necessary.
   */
  isEqualWithTolerance(rhs: BoxedExpression, tolerance: number): boolean {
    return rhs instanceof BoxedNumber && signDiff(this, rhs, tolerance) === 0;
  }

  isLess(rhs: BoxedExpression): boolean | undefined {
    const s = signDiff(this, rhs);
    if (s === undefined) return undefined;
    return s < 0;
  }

  isLessEqual(rhs: BoxedExpression): boolean | undefined {
    const s = signDiff(this, rhs);
    if (s === undefined) return undefined;
    return s <= 0;
  }

  isGreater(rhs: BoxedExpression): boolean | undefined {
    return rhs.isLessEqual(this);
  }

  isGreaterEqual(rhs: BoxedExpression): boolean | undefined {
    return rhs.isLess(this);
  }

  /** x > 0, same as `isGreater(0)` */
  get isPositive(): boolean | undefined {
    if (typeof this._value === 'number') return this._value > 0;
    const s = this.sgn;
    if (s === undefined || s === null) return undefined;
    return s > 0;
  }

  /** x >= 0, same as `isGreaterEqual(0)` */
  get isNonNegative(): boolean | undefined {
    if (typeof this._value === 'number') return this._value >= 0;
    const s = this.sgn;
    if (s === undefined || s === null) return undefined;
    return s >= 0;
  }

  /** x < 0, same as `isLess(0)` */
  get isNegative(): boolean | undefined {
    if (typeof this._value === 'number') return this._value < 0;
    const s = this.sgn;
    if (s === undefined || s === null) return undefined;
    return s < 0;
  }

  /** x <= 0, same as `isLessEqual(0)` */
  get isNonPositive(): boolean | undefined {
    if (typeof this._value === 'number') return this._value <= 0;
    const s = this.sgn;
    if (s === undefined || s === null) return undefined;
    return s <= 0;
  }

  get isZero(): boolean {
    if (this._value === 0) return true;

    if (this._value instanceof Decimal) return this._value.isZero();

    if (this._value instanceof Complex) return this._value.isZero();

    // Rationals can never be zero: they get downcast to
    // a machine number during boxing (ctor) if numerator is 0
    return false;
  }

  get isNotZero(): boolean {
    if (this._value === 0) return false;

    if (this._value instanceof Decimal) return !this._value.isZero();

    if (this._value instanceof Complex) return !this._value.isZero();

    return true;
  }

  get isOne(): boolean {
    if (this._value === 1) return true;
    if (typeof this._value === 'number') return false;

    if (this._value instanceof Decimal)
      return this._value.equals(this.engine._BIGNUM_ONE);

    if (this._value instanceof Complex)
      return this._value.im === 0 && this._value.re === 1;

    return isRationalOne(this._value);
  }

  get isNegativeOne(): boolean {
    if (this._value === -1) return true;
    if (typeof this._value === 'number') return false;

    if (this._value instanceof Decimal)
      return this._value.equals(this.engine._BIGNUM_NEGATIVE_ONE);

    if (this._value instanceof Complex)
      return this._value.im === 0 && this._value.re === -1;

    return isRationalNegativeOne(this._value);
  }

  get isOdd(): boolean | undefined {
    if (this.isOne || this.isNegativeOne) return true;
    if (this.isZero) return false;

    if (!this.isInteger) return false;

    if (typeof this._value === 'number') return this._value % 2 !== 0;

    if (this._value instanceof Decimal) return !this._value.mod(2).isZero();

    // Note: rational and complex numbers are not considered even or odd

    return undefined;
  }

  get isEven(): boolean | undefined {
    if (this.isOne || this.isNegativeOne) return false;
    if (this.isZero) return true;

    if (!this.isInteger) return false;

    if (typeof this._value === 'number') return this._value % 2 === 0;

    if (this._value instanceof Decimal) return this._value.mod(2).isZero();

    // Note: rational and complex numbers are not considered even or odd

    return undefined;
  }

  get isPrime(): boolean | undefined {
    if (
      !this.isInteger ||
      !this.isFinite ||
      this.isNonPositive ||
      this.isOne ||
      this.isZero
    )
      return false;

    if (typeof this._value === 'number') return isPrime(this._value);

    // @todo: prime for Decimal integers
    if (this._value instanceof Decimal) return isPrime(this._value.toNumber());
    return undefined;
  }

  get isComposite(): boolean | undefined {
    if (
      !this.isInteger ||
      !this.isFinite ||
      this.isNonPositive ||
      this.isOne ||
      this.isZero
    )
      return false;

    if (typeof this._value === 'number') return !isPrime(this._value);

    // @todo: prime for Decimal integers
    if (this._value instanceof Decimal) return !isPrime(this._value.toNumber());
    return undefined;
  }

  get isInfinity(): boolean {
    if (typeof this._value === 'number')
      return !Number.isFinite(this._value) && !Number.isNaN(this._value);

    if (this._value instanceof Decimal)
      return !this._value.isFinite() && !this._value.isNaN();

    if (this._value instanceof Complex)
      return !this._value.isFinite() && !this._value.isNaN();

    // Note: Rational numbers cannot be Infinity, they are
    // converted to a machine infinity during boxing (ctor)

    return false;
  }

  get isNaN(): boolean {
    if (typeof this._value === 'number') return Number.isNaN(this._value);

    if (this._value instanceof Decimal) return this._value.isNaN();

    if (this._value instanceof Complex) return this._value.isNaN();

    // Note: Rational numbers cannot be NaN, they are
    // converted to a machine NaN during boxing (ctor)

    return false;
  }

  get isFinite(): boolean {
    return !this.isInfinity && !this.isNaN;
  }

  get isNumber(): true {
    return true;
  }

  get isInteger(): boolean {
    if (typeof this._value === 'number') return Number.isInteger(this._value);

    if (this._value instanceof Decimal) return this._value.isInteger();

    // Note that some non-reduced rational numbers, such as `4/2`
    // are not considered integers.
    return false;
  }

  get isRational(): boolean {
    // Note that `isRational` is true for some non-canonical
    // rationals, i.e. `4/2`
    if (Array.isArray(this._value)) return true;

    // Every integer is also a rational
    return this.isInteger;
  }

  get isAlgebraic(): boolean | undefined {
    // Rational numbers (and integers) are definitely algebraic
    if (this.isRational) return true;
    // For the rest, who knows...
    return undefined;
  }

  get isReal(): boolean {
    if (!this.isFinite) return false;
    if (this._value instanceof Complex)
      return this.engine.chop(this._value.im) === 0;

    return true;
  }

  // Real or +-Infinity
  get isExtendedReal(): boolean {
    // We don't have to check for undefined, for BoxedNumber,
    // isInfinity and isReal never return undefined
    return this.isInfinity || this.isReal;
  }

  get isComplex(): boolean | undefined {
    // A real number, or an imaginary number
    // isFinite
    return !this.isNaN;
  }

  get isImaginary(): boolean | undefined {
    if (this._value instanceof Complex) {
      console.assert(this._value.im !== 0);
      return true;
    }

    return false;
  }

  get isExtendedComplex(): boolean | undefined {
    return this.isInfinity || !this.isNaN;
  }

  get canonical(): BoxedExpression {
    if (this._isCanonical) return this;

    return this.engine.number(canonicalNumber(this.engine, this._value));
  }

  simplify(_options?: SimplifyOptions): BoxedExpression {
    return this.canonical;
  }

  evaluate(options?: EvaluateOptions): BoxedExpression {
    if (options?.numericMode) return this.N(options);
    return this;
  }

  N(_options?: NOptions): BoxedExpression {
    if (!Array.isArray(this._value)) return this;

    // If a rational, evaluate as an approximation
    const ce = this.engine;
    const [numer, denom] = this._value;
    if (
      typeof numer === 'number' &&
      typeof denom === 'number' &&
      !bignumPreferred(ce)
    )
      return ce.number(numer / denom);

    return ce.number(ce.bignum(numer).div(ce.bignum(denom)));
  }
}

function canonicalNumber(
  ce: IComputeEngine,
  value: number | Decimal | Complex | Rational
): number | Decimal | Complex | Rational {
  // We choose to store bignums as machine numbers when possible
  // This doesn't affect evaluation later. It may require
  // the number to be upconverted later, but is a memory saving now. Not 100% clear what is the best strategy from a performance point of view.
  if (value instanceof Decimal && isInMachineRange(value))
    return value.toNumber();
  if (!isRational(value)) return value;
  value = reducedRational(value);

  if (isBigRational(value)) {
    let [n, d] = value;
    if (
      n > Number.MIN_SAFE_INTEGER &&
      n < Number.MAX_SAFE_INTEGER &&
      d > Number.MIN_SAFE_INTEGER &&
      d < Number.MAX_SAFE_INTEGER
    )
      value = [Number(n), Number(d)];
    else {
      if (d < 0) [n, d] = [-n, -d];

      if (d === BigInt(1)) return ce.bignum(n);

      if (d === BigInt(0)) {
        if (n === d) return NaN;
        return n < 0 ? -Infinity : +Infinity;
      }

      return [n, d];
    }
  }

  let [n, d] = value as [number, number];
  if (Number.isNaN(n) || Number.isNaN(d)) return NaN;

  if (d < 0) [n, d] = [-n, -d];

  if (d === 1) return n;

  if (d === 0) {
    if (n === 0 || !Number.isFinite(n)) return NaN;
    if (n < 0) return -Infinity;
    return +Infinity;
  }

  // Could be +0 or -0
  if (n === 0) return n;

  return [n, d];
}
