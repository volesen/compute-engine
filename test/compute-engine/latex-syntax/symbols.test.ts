import { validateIdentifier } from '../../../src/math-json/utils';
import { box, parse, latex } from '../../utils';

// for (let i = 0; i < 0x10ffff; i++) {
//   const s = String.fromCodePoint(i);
//   if (/\p{Emoji}/u.test(s) && /\p{XIDC}/s.test(s)) {
//     console.info(s, `U+${i.toString(16).toUpperCase()}`);
//   }
// }

describe('SYMBOLS', () => {
  describe('validateIdentifier()', () => {
    test('Valid identifiers', () => {
      expect(validateIdentifier('x')).toEqual('valid');
      expect(validateIdentifier('ab')).toEqual('valid');
      expect(validateIdentifier('θ')).toEqual('valid');
      expect(validateIdentifier('ϑ')).toEqual('valid');
      expect(validateIdentifier('_')).toEqual('valid');
      expect(validateIdentifier('_a')).toEqual('valid');
      expect(validateIdentifier('o_o')).toEqual('valid');
      expect(validateIdentifier('café')).toEqual('valid');

      // Catalan interpunct is valid in an identifier and not
      // considered punctuation (also used in French for "écriture inclusive")
      expect(validateIdentifier('col·lecció')).toEqual('valid');

      // Oh boy. "8" is an emoji. Specifically, it has the emoji property
      // "Emoji" and the emoji property "Emoji_Component" (EC), but
      // it is not a "Emoji_Presentation" (EP). It doesn't
      // have "Extended_Pictographic" either.
      // This is because the emoji 8️⃣ (8 keycap) is a sequence of two
      // code points: 8 (base), U+FE0F (variation selector-16) and
      // U+20E3 (combining enclosing keycap).
      expect(validateIdentifier('a8')).toEqual('valid');
      expect(validateIdentifier('8️⃣')).toEqual('valid');
      expect(validateIdentifier('a8️⃣')).toEqual('unexpected-mixed-emoji');

      // Emoji with skin tone and ZWJ
      // Man            U+1F468
      // Skin1-2        U+1F3FB
      // ZWJ            U+200D
      // Microphone     U+1F3A4
      expect(validateIdentifier('👨🏻‍🎤')).toEqual('valid');

      // Some emojis are displayed by default as black and white
      // characters. For example, 🕶 U+1F576 (xD83D xDD76) has the emoji
      // properties:
      // - "Emoji"
      // - "Extended_Pictographic" property
      // It does not have
      // - "Emoji_Presentation" (EP).
      // Interestingly, this specific emoji appears to be displayed
      // the same with or without the Emoji Presentation (VS-16).
      // A combination of emojis with and without EP is allowed.
      // The specific sequence 😎🤏😳🕶🤏 was found in the wild.

      // Sequence of emojis with presentation and non-presentation
      expect(validateIdentifier('😎🤏😳🕶🤏')).toEqual('valid');

      // Sequence of emojis with presentation and VS-16
      // VS-16 U+FE0F
      expect(validateIdentifier('😎🤏😳🕶\uFE0F🤏')).toEqual('valid');

      // UN flag.
      // First way to encode flags: as a sequence of two regional
      // indicator symbols
      //
      // 🇺 U+1F1FA 🇳 U+1F1F3
      expect(validateIdentifier('🇺🇳')).toEqual('valid');

      // England flag
      // Second way of encoding flags: as a flag emoji followed by
      // tag emojis, and a cancel tag at the end.
      // The England flag uses the tags "gbeng":
      //
      //  U+1F3F4 U+E0067 U+E0062 U+E0065 U+E006E U+E0067 U+E007F
      expect(validateIdentifier('🏴󠁧󠁢󠁥󠁮󠁧󠁿')).toEqual('valid');

      // Same thing with the CA flag, but it is rarely displayed correctly
      //
      // 🏴 U+1F3F4 󠁵u U+E0075 󠁳s U+E0073 c󠁣 U+E0063 a 󠁡 U+E0061 cancel 󠁿 U+E007F
      expect(validateIdentifier('🏴󠁵󠁳󠁣󠁡󠁿')).toEqual('valid');

      // Rainbow flag.
      // Third way to encode flags, as a sequence of various emojis combined.
      //
      // 🏳 U+1F3F3 ️ VS-16 U+FE0F ‍ ZWJ U+200D 🌈 U+1F308
      expect(validateIdentifier('🏳️‍🌈')).toEqual('valid');

      // Checkered flag.
      // Fourth way to encode flags, as a standalone emoji
      // U+1F3C1
      expect(validateIdentifier('🏁')).toEqual('valid');

      // Flag (regional indicator) and non-flag mixed
      expect(validateIdentifier('👨🏻‍🎤🇺🇸')).toEqual('valid');

      // Non latin letters
      expect(validateIdentifier('半径')).toEqual('valid');
      expect(validateIdentifier('半径8546')).toEqual('valid');
      // Not recommended, but valid: script combos
      expect(validateIdentifier('半径circle')).toEqual('valid');
      // Caution: make sure the string is NFC-normalized (see below):
      // '\u5dc\u5b0\u5d4\u5b7\u5d2\u5d1\u5b4\u5bc\u5d9\u5dc'
      expect(validateIdentifier('לְהַגבִּיל')).toEqual('valid');
    });
    test('Not a string', () => {
      expect(validateIdentifier(42)).toEqual('not-a-string');
    });
    test('Empty string', () => {
      expect(validateIdentifier('')).toEqual('empty-string');
    });
    test('Expected NFC', () => {
      expect(validateIdentifier('cafe\u0301')).toEqual('expected-nfc');

      //Not normalized: לְהַגבִּיל = '\u05dc\u05b0\u05d4\u05b7\u05d2\u05d1\u05bc\u05b4\u05d9\u05dc'
      // Normalized: '\u05dc\u05b0\u05d4\u05b7\u05d2\u05d1\u05b4\u05bc\u05d9\u05dc'
      expect(
        validateIdentifier(
          '\u05dc\u05b0\u05d4\u05b7\u05d2\u05d1\u05bc\u05b4\u05d9\u05dc'
        )
      ).toEqual('expected-nfc');
    });
    test('Mixed Emoji', () => {
      expect(validateIdentifier('not😀')).toEqual('unexpected-mixed-emoji');
      // Flag with non-emoji
      expect(validateIdentifier('USA🇺🇸')).toEqual('unexpected-mixed-emoji');
    });
    test('Bidi marker', () => {
      // Note: bidi markers are stripped when parsing LaTeX
      expect(validateIdentifier('מְהִירוּת\u200E')).toEqual(
        'unexpected-bidi-marker'
      );
    });
    test('Unexpected script', () => {
      expect(validateIdentifier('𓀀')).toEqual('unexpected-script');
    });
    test('Invalid first char', () => {
      expect(validateIdentifier('+')).toEqual('invalid-first-char');
      expect(validateIdentifier('$x')).toEqual('invalid-first-char');
    });
    test('Invalid char', () => {
      expect(validateIdentifier('a.b')).toEqual('invalid-char');
    });
  });

  describe('BOXING', () => {
    test('simple identifiers', () => {
      expect(box('x')).toEqual(`x`);
    });
    test('multi letter identifier', () => {
      expect(box('ab')).toEqual('ab');
    });
    test('multi letter identifier with digits', () => {
      expect(box('a8')).toEqual(`a8`);
    });
    test('greek letters and symbols', () => {
      expect(box('θ')).toEqual(`θ`);
      // `vartheta` or THETA SYMBOL (as Unicode calls it) is a variant
      // of the theta letter which is used in math, not written greek
      // Both are valid.
      expect(box('ϑ')).toEqual(`ϑ`);
    });
    test('underline', () => {
      expect(box('_')).toEqual(`_`);
      expect(box('__')).toEqual(`__`);
      expect(box('_a')).toEqual(`_a`);
      expect(box('o_o')).toEqual(`o_o`);
    });
    test('extended latin', () => {
      expect(box('café')).toEqual(`café`);
      expect(box('col·lecció')).toEqual(`col·lecció`);
    });
    test('emojis', () => {
      expect(box('😎🤏😳🕶🤏')).toEqual(`😎🤏😳🕶🤏`);
      // emoji with ZWJ and skin tone
      expect(box('👨🏻‍🎤')).toEqual(`👨🏻‍🎤`);
    });
    test('non-latin scripts', () => {
      expect(box('半径')).toEqual(`半径`);
      expect(box('半径8546')).toEqual(`半径8546`);
      expect(box('半径circle')).toEqual(`半径circle`);
      expect(box('לְהַגבִּיל')).toEqual('לְהַגבִּיל');
    });
  });

  describe('BOXING ERRORS', () => {
    test('Math operators are not valid symbols', () => {
      expect(box('+')).toMatchInlineSnapshot(
        `["Error", "'invalid-identifier'", "'+'"]`
      );
      expect(box('=')).toMatchInlineSnapshot(
        `["Error", "'invalid-identifier'", "'='"]`
      );
    });

    test('LaTeX commands are not valid symbols', () => {
      expect(box('\\alpha')).toMatchInlineSnapshot(
        `["Error", "'invalid-identifier'", "'\\alpha'"]`
      );
    });

    test('Braile symbols are not valid symbols', () => {
      expect(box('⠋')).toMatchInlineSnapshot(
        `["Error", "'invalid-identifier'", "'⠋'"]`
      );
    });

    // U+13000, D80C DC00
    test('Egyptians Hieroglyphs are not valid symbols', () => {
      expect(box('𓀀')).toMatchInlineSnapshot(
        `["Error", "'invalid-identifier'", "'𓀀'"]`
      );
    });

    test('Symbols should not include LTR or RTL marks', () => {
      expect(box('מְהִירוּת‎')).toMatchInlineSnapshot(
        `["Error", "'invalid-identifier'", "'מְהִירוּת‎'"]`
      );
      expect(box('‎מְהִירוּת')).toMatchInlineSnapshot(
        `["Error", "'invalid-identifier'", "'‎מְהִירוּת'"]`
      );
    });
    test('Symbols should not mix emojis and non-emojis', () => {
      expect(box('👨🏻‍🎤DavidBowie')).toMatchInlineSnapshot(
        `["Error", "'invalid-identifier'", "'👨🏻‍🎤DavidBowie'"]`
      );
      expect(box('DavidBowie👨🏻‍🎤')).toMatchInlineSnapshot(
        `["Error", "'invalid-identifier'", "'DavidBowie👨🏻‍🎤'"]`
      );
    });
  });

  describe('PARSING', () => {
    test('single letter identifiers', () => {
      expect(parse('x')).toEqual(`x`);
      expect(parse('\\mathit{x}')).toEqual(`x_italic`);
      expect(parse('\\mathrm{x}')).toEqual(`x_upright`);
    });
    test('multi letter identifier', () => {
      // Multi-letter identifiers are upright by default
      expect(parse('\\mathrm{ab}')).toEqual(`ab`);
      expect(parse('\\operatorname{ab}')).toEqual(`ab`);
      expect(parse('\\mathit{ab}')).toEqual(`ab_italic`);
    });

    test('multiletter with subscript', () => {
      expect(parse('\\mathrm{speed_{max}}')).toMatchInlineSnapshot(`speed_max`);
      // An expression, not an identifier:
      expect(parse('\\mathrm{speed}_{max}')).toMatchInlineSnapshot(
        `["Subscript", "speed", ["Multiply", "m", "a", "x"]]`
      );
    });

    test('multi letter identifier with digits', () => {
      expect(parse('\\mathrm{a8}')).toEqual(`a8`);
    });
    test('greek letters and symbols', () => {
      expect(parse('\\theta')).toEqual(`theta`);
      expect(parse('\\vartheta')).toEqual(`thetaSymbol`);
    });
    test('underline', () => {
      expect(parse('\\_')).toEqual(`_`);
      expect(parse('\\mathrm{\\_a}')).toEqual(`_a`);
      expect(parse('\\mathrm{o\\_o}')).toEqual(`o_o`);
    });
    test('extended latin', () => {
      expect(parse('\\operatorname{caf\\char"00E9}')).toMatchInlineSnapshot(
        `café`
      );
    });
    test('emojis', () => {
      // Sequence of emojis do not need to be wrapped...
      expect(parse('🥤+🍔🍟=3')).toMatchInlineSnapshot(
        `["Equal", ["Add", "🍔🍟", "🥤"], 3]`
      );
      // ... but optionally they can be.
      expect(parse('\\operatorname{😎🤏😳🕶🤏}')).toEqual(`😎🤏😳🕶🤏`);
      // emoji with ZWJ and skin tone
      // U+1F468 U+1F3FB U+200D U+1F3A4
      expect(parse('👨🏻‍🎤')).toEqual(`👨🏻‍🎤`);
    });
    test('non-latin scripts', () => {
      expect(parse('\\operatorname{半径}')).toEqual(`半径`);
      expect(parse('\\operatorname{半径8546}')).toEqual(`半径8546`);
      expect(parse('\\operatorname{半径circle}')).toEqual(`半径circle`);
      expect(parse('\\operatorname{לְהַגבִּיל}')).toEqual(`לְהַגבִּיל`);
      // Bidi markers are OK outside of identifiers (they are ignored, though,
      // since they are not applicable to the math layout algorithm)
      expect(parse('\\operatorname{לְהַגבִּיל}\u200e')).toEqual(`לְהַגבִּיל`);
    });
  });
  describe('PARSING SYMBOLS WITH MODIFIERS', () => {
    test('Expressions that should not be interpreted as identifiers with modifiers', () => {
      expect(parse('x^2')).toMatch(`["Square", "x"]`);
      expect(parse('a^b')).toMatch(`["Power", "a", "b"]`);
      expect(parse('x_{i+1}')).toMatch(`["Subscript", "x", ["Add", "i", 1]]`);
      expect(parse('\\vec{x}')).toMatch(`["OverVector", "x"]`);
      expect(parse('x^\\prime')).toMatch(`["Prime", "x"]`);
      expect(parse('\\vec{AB}')).toMatch(
        `["OverVector", ["Multiply", "A", "B"]]`
      );
    });

    test('Identifiers without modifiers', () => {
      expect(parse('x')).toEqual(`x`);
      expect(parse('\\mathit{x}')).toEqual(`x_italic`);
      expect(parse('\\mathrm{x}')).toEqual(`x_upright`);
      expect(parse('\\mathrm{ab}')).toEqual(`ab`);
      expect(parse('\\mathrm{ab012}')).toEqual(`ab012`);
      expect(parse('\\mathrm{ab_0}')).toEqual(`ab_0`);
      expect(parse('\\mathrm{\\alpha}')).toEqual(`alpha`);
      expect(parse('👨🏻‍🎤')).toEqual(`👨🏻‍🎤`);
      expect(parse('😎🤏😳🕶🤏')).toEqual(`😎🤏😳🕶🤏`);
      expect(parse('\\mathrm{半径}')).toEqual(`半径`);
      expect(parse('\\mathrm{半径8546}')).toEqual(`半径8546`);
      expect(parse('\\mathrm{לְהַגבִּיל}')).toEqual(`לְהַגבִּיל`);
    });

    test('Invalid identifiers', () => {
      expect(parse('\\mathrm{=}')).toMatchInlineSnapshot(`
        [
          "Error",
          ["ErrorCode", "'invalid-identifier'", "'invalid-first-char'"],
          ["LatexString", "'\\mathrm{=}'"]
        ]
      `);
      expect(parse('\\mathrm{⠋}')).toMatchInlineSnapshot(`
        [
          "Error",
          ["ErrorCode", "'invalid-identifier'", "'unexpected-script'"],
          ["LatexString", "'\\mathrm{⠋}'"]
        ]
      `);
      expect(parse('\\mathrm{𓀀}')).toMatchInlineSnapshot(`
        [
          "Error",
          ["ErrorCode", "'invalid-identifier'", "'unexpected-script'"],
          ["LatexString", "'\\mathrm{𓀀}'"]
        ]
      `);
      expect(parse('\\mathrm{👨🏻‍🎤DavidBowie}')).toMatchInlineSnapshot(`
        [
          "Error",
          ["ErrorCode", "'invalid-identifier'", "'unexpected-mixed-emoji'"],
          ["LatexString", "'\\mathrm{👨🏻‍🎤DavDavidBowie}'"]
        ]
      `);
    });

    test('Identifiers with single modifiers', () => {
      expect(parse('\\mathfrak{X}')).toMatchInlineSnapshot(`X_fraktur`);
      expect(parse('\\mathbf{x}')).toMatchInlineSnapshot(`x_bold`);

      // Special handling of initial digits
      expect(parse('\\mathbb{1}')).toEqual(`one_doublestruck`);
    });

    test('Identifiers with multiple modifiers', () => {
      expect(parse('\\mathrm{\\vec{x}^\\prime}')).toMatch(`x_vec_prime`);
      expect(parse('\\mathrm{\\vec{\\mathbf{x}}}')).toMatch(`x_bold_vec`);
      expect(parse('\\mathbf{\\vec{x}}')).toMatch(`x_vec_bold`);
      expect(parse('\\mathbf{\\mathsf{x}}')).toEqual(`x_sansserif_bold`);
      expect(parse('\\mathsf{\\mathbf{x}}')).toEqual(`x_bold_sansserif`);
      expect(parse('\\mathbf{\\vec{x}_{\\mathfrak{I}}}')).toMatchInlineSnapshot(
        `x_vec_I_fraktur_bold`
      );
    });

    test('Identifiers with common names', () => {
      expect(parse('\\mathrm{x^+}')).toEqual(`x__plus`);
    });
  });

  describe('PARSING ERRORS', () => {
    test('Math operators are not valid symbols', () => {
      expect(parse('\\mathrm{=}')).toMatchInlineSnapshot(`
        [
          "Error",
          ["ErrorCode", "'invalid-identifier'", "'invalid-first-char'"],
          ["LatexString", "'\\mathrm{=}'"]
        ]
      `);
    });
    test('Braille are not valid symbols', () => {
      expect(parse('\\mathrm{\\char"280B}')).toMatchInlineSnapshot(`
        [
          "Error",
          ["ErrorCode", "'invalid-identifier'", "'unexpected-script'"],
          ["LatexString", "'\\mathrm{\\char"280B}'"]
        ]
      `);
    });
    test('Egyptians Hieroglyphs are not valid symbols', () => {
      expect(parse('\\mathrm{\\char"13000}')).toMatchInlineSnapshot(`
        [
          "Error",
          ["ErrorCode", "'invalid-identifier'", "'unexpected-script'"],
          ["LatexString", "'\\mathrm{\\char"13000}'"]
        ]
      `);
    });

    test('Tokenization should remove bidi markers', () => {
      expect(parse('\\mathrm{מְהִירוּת‎}')).toEqual(`מְהִירוּת`);
      expect(parse('\\mathrm{‎מְהִירוּת}')).toEqual(`מְהִירוּת`);
    });

    test('Symbols should not mix emojis and non-emojis', () => {
      expect(parse('\\mathrm{👨🏻‍🎤DavidBowie}')).toMatchInlineSnapshot(`
        [
          "Error",
          ["ErrorCode", "'invalid-identifier'", "'unexpected-mixed-emoji'"],
          ["LatexString", "'\\mathrm{👨🏻‍🎤DavDavidBowie}'"]
        ]
      `);
      expect(parse('\\mathrm{DavidBowie👨🏻‍🎤}')).toMatchInlineSnapshot(`
        [
          "Error",
          ["ErrorCode", "'invalid-identifier'", "'unexpected-mixed-emoji'"],
          ["LatexString", "'\\mathrm{DavidBowie👨🏻‍🎤}}'"]
        ]
      `);
    });
  });

  describe('SERIALIZING', () => {
    test('no modifier', () => {
      expect(latex('x')).toEqual('x');
      expect(latex('x_upright')).toEqual(`\\mathrm{x}`);
      expect(latex('x_italic')).toEqual(`\\mathit{x}`);
      expect(latex('speed')).toEqual(`\\mathrm{speed}`);
      expect(latex('speed_max')).toEqual(`\\mathrm{speed_{max}}`);
      expect(latex('_')).toEqual(`\\operatorname{\\_}`);
      expect(latex('_0')).toEqual(`\\operatorname{\\_0}`);
      expect(latex('_abc')).toEqual(`\\operatorname{\\_abc}`);
      expect(latex('o_o')).toEqual(`\\mathrm{o_{o}}`); // single char uses mathrm rather than operatorname
      expect(latex('café')).toEqual(`\\mathrm{café}`);
      // Catalan interpunct (·) is valid in an identifier
      expect(latex('col·lecció')).toEqual(`\\mathrm{col·lecció}`);
      expect(latex('😎🤏😳🕶🤏')).toEqual('😎🤏😳🕶🤏');
      expect(latex('👨🏻‍🎤')).toEqual('👨🏻‍🎤');
      expect(latex('半径')).toEqual(`\\mathrm{半径}`);
    });

    test('single modifier', () => {
      expect(latex('x_deg')).toMatch(`\\mathrm{x\\degree}`);
      expect(latex('x_prime')).toMatch(`\\mathrm{x^{\\prime}}`);
      expect(latex('x_dprime')).toMatch(`\\mathrm{x^{\\doubleprime}}`);
      expect(latex('x_ring')).toMatch(`\\mathrm{\\mathring{x}}`);
      expect(latex('x_hat')).toMatch(`\\mathrm{\\hat{x}}`);
      expect(latex('x_tilde')).toMatch(`\\mathrm{\\tilde{x}}`);
      expect(latex('x_vec')).toMatch(`\\mathrm{\\vec{x}}`);
      expect(latex('x_bar')).toMatch(`\\mathrm{\\overline{x}}`);
      expect(latex('x_underbar')).toMatch(`\\mathrm{\\underline{x}}`);
      expect(latex('x_dot')).toMatch(`\\mathrm{\\dot{x}}`);
      expect(latex('x_ddot')).toMatch(`\\mathrm{\\ddot{x}}`);
      expect(latex('x_tdot')).toMatch(`\\mathrm{\\dddot{x}}`);
      expect(latex('x_qdot')).toMatch(`\\mathrm{\\ddddot{x}}`);
      expect(latex('a_acute')).toMatch(`\\mathrm{\\acute{a}}`);
      expect(latex('a_grave')).toMatch(`\\mathrm{\\grave{a}}`);
      expect(latex('a_breve')).toMatch(`\\mathrm{\\breve{a}}`);
      expect(latex('a_check')).toMatch(`\\mathrm{\\check{a}}`);
      expect(latex('x_upright')).toMatch(`\\mathrm{x}`);
      expect(latex('x_italic')).toMatch(`\\mathit{x}`);
      expect(latex('x_bold')).toMatch(`\\mathbf{x}`);
      expect(latex('x_script')).toMatch(`\\mathscr{x}`);
      expect(latex('x_fraktur')).toMatch(`\\mathfrak{x}`);
      expect(latex('x_doublestruck')).toMatch(`\\mathbb{x}`);
      expect(latex('x_blackboard')).toMatch(`\\mathbb{x}`);
      expect(latex('x_bold_talic')).toMatch(`\\mathbf{x_{talic}}`);
      expect(latex('x_calligraphic')).toMatch(`\\mathcal{x}`);
      expect(latex('x_script_old')).toMatchInlineSnapshot(`\\mathscr{x_{old}}`);
      expect(latex('x_calligraphic_bold')).toMatchInlineSnapshot(
        `\\mathbf{\\mathcal{x}}`
      );
      expect(latex('x_gothic_bold')).toEqual(`\\mathbf{\\mathfrak{x}}`);
      expect(latex('x_fraktur_bold')).toEqual(`\\mathbf{\\mathfrak{x}}`);
      expect(latex('x_sansserif')).toEqual(`\\mathsf{x}`);
      expect(latex('x_sansserif_bold')).toEqual(`\\mathbf{\\mathsf{x}}`);
      expect(latex('x_sansserif_italic')).toEqual(`\\mathit{\\mathsf{x}}`);
      expect(latex('x_monospace')).toEqual(`\\mathtt{x}`);
      expect(latex('one_blackboard')).toEqual(`\\mathbb{1}`);
    });

    test('multiple modifiers', () => {
      expect(latex('x_hat_vec')).toEqual(`\\mathrm{\\vec{\\hat{x}}}`);
      expect(latex('x_vec_hat')).toEqual(`\\mathrm{\\hat{\\vec{x}}}`);
      expect(latex('x_hat_vec_calligraphic')).toEqual(
        `\\mathcal{\\vec{\\hat{x}}}`
      );
      expect(latex('x_calligraphic_hat_vec')).toEqual(
        `\\mathcal{x_{\\vec{hat}}}`
      );
      expect(latex('x_bold_italic')).toEqual(`\\mathit{\\mathbf{x}}`);
      expect(latex('x_calligraphic_bold')).toEqual(`\\mathbf{\\mathcal{x}}`);
      expect(latex('x_vec_bold_I_fraktur')).toEqual(
        `\\mathbf{\\vec{x}_{\\mathfrak{I}}}`
      );
    });

    test('multiletters and non-latin scripts with modifiers and subscripts', () => {
      expect(latex('speed_bold')).toEqual(`\\mathbf{speed}`);
      expect(latex('radius_moon')).toEqual(`\\mathrm{radius_{moon}}`);
      expect(latex('半径_bold')).toEqual(`\\mathbf{半径}`);
      expect(latex('半径_earth')).toEqual(`\\mathrm{半径_{earth}}`);
    });

    test('superscripts and subscripts', () => {
      expect(latex('speed_max')).toEqual(`\\mathrm{speed_{max}}`);
      expect(latex('speed_light_max')).toEqual(`\\mathrm{speed_{light,max}}`);
      expect(latex('mass__earth')).toEqual(`\\mathrm{mass^{earth}}`);
      expect(latex('radius__moon_min')).toEqual(
        `\\mathrm{radius^{moon}_{min}}`
      );
    });

    test('numeric modifiers', () => {
      expect(latex('x0')).toEqual(`\\mathrm{x_{0}}`);
      expect(latex('x123')).toEqual(`\\mathrm{x_{123}}`);
      expect(latex('mu_123')).toEqual(`\\mathrm{\\mu_{123}}`);
    });

    test('special names', () => {
      expect(latex('alpha')).toEqual(`\\alpha`);
      expect(latex('deltagamma')).toMatchInlineSnapshot(`\\mathrm{deltagamma}`);
      expect(latex('Alpha')).toEqual(`\\Alpha`);
      expect(latex('aleph')).toEqual(`\\aleph`);
      expect(latex('aleph__plus')).toMatchInlineSnapshot(
        `\\mathrm{\\aleph^{+}}`
      );
      expect(latex('x_alpha')).toEqual(`\\mathrm{x_{\\alpha}}`);
      expect(latex('alpha_gamma')).toEqual(`\\mathrm{\\alpha_{\\gamma}}`);
      expect(latex('alpha_gamma_delta')).toEqual(
        `\\mathrm{\\alpha_{\\gamma,\\delta}}`
      );
      expect(latex('beta_bold')).toEqual(`\\mathbf{\\beta}`);
      expect(latex('beta_calligraphic')).toMatchInlineSnapshot(
        `\\mathcal{\\beta}`
      );
      expect(latex('x_plus')).toEqual(`\\mathrm{x_{+}}`);
      expect(latex('R_blackboard__0__plus')).toEqual(`\\mathbb{R^{0,+}}`);
    });
  });
});
