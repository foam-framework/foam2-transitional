/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// These tests are for the "interpretive", non-compiled parsers.

describe('parsers', function() {
  var parsers = foam.parse.Parsers.create();
  var seq = parsers.seq;
  var repeatDrop = parsers.repeatDrop;
  var simpleAlt = parsers.simpleAlt;
  var alt = parsers.alt;
  var sym = parsers.sym;
  var seqAt = parsers.seqAt;
  var repeat = parsers.repeat;
  var plus = parsers.plus;
  var range = parsers.range;
  var notChars = parsers.notChars;
  var repeatUntil = parsers.repeatUntil;
  var optional = parsers.optional;
  var literal = parsers.literal;
  var literalIC = parsers.literalIC;
  var str = parsers.str;
  var anyChar = parsers.anyChar;

  var mkStream = function(str) {
    var ps = foam.parse.StringPS.create();
    ps.setString(str);
    return ps;
  };

  describe('literal()', function() {
    it('should correctly match a matching string', function() {
      var ps = literal('foo').parse(mkStream('foo'));
      expect(ps).toBeDefined();
      expect(ps.value).toBe('foo');
    });

    it('should parse only as far as it matches', function() {
      var ps = literal('foo').parse(mkStream('foobar'));
      expect(ps).toBeDefined();
      expect(ps.head).toBe('b');
      expect(ps.value).toBe('foo');
    });

    it('should not consume anything when it fails', function() {
      expect(literal('foo').parse(mkStream('fobar'))).toBeUndefined();
    });

    it('should insist on correct case', function() {
      expect(literal('foo').parse(mkStream('FOO'))).toBeUndefined();
    });

    it('should fail on EOF', function() {
      expect(literal('foo').parse(mkStream('fo'))).toBeUndefined();
    });

    it('should return the fixed value, if provided', function() {
      var ps = literal('abc', 7).parse(mkStream('abc'));
      expect(ps).toBeDefined();
      expect(ps.value).toBe(7);
    });
  });

  describe('literalIC()', function() {
    it('should correctly parse a matching string', function() {
      var ps = literalIC('foo').parse(mkStream('foo'));
      expect(ps).toBeDefined();
      expect(ps.value).toBe('foo');
    });

    it('should ignore case and return canonical spelling', function() {
      var ps = literalIC('foo').parse(mkStream('FOO'));
      expect(ps).toBeDefined();
      expect(ps.value).toBe('foo');
    });

    it('should parse only as far as it matches', function() {
      var ps = literalIC('foo').parse(mkStream('FOOBAR'));
      expect(ps).toBeDefined();
      expect(ps.value).toBe('foo');
      expect(ps.head).toBe('B');
    });

    it('should fail on a mismatch', function() {
      expect(literalIC('foo').parse(mkStream('FOBAR'))).toBeUndefined();
    });

    it('should fail on EOF', function() {
      expect(literalIC('foo').parse(mkStream('FO'))).toBeUndefined();
    });

    it('should return the fixed value, if provided', function() {
      var ps = literalIC('abc', 7).parse(mkStream('ABc'));
      expect(ps).toBeDefined();
      expect(ps.value).toBe(7);
    });
  });

  describe('str()', function() {
    it('combines its results into one string', function() {
      var ps = str(seq('abc', literalIC('def'))).parse(mkStream('abcDEF'));
      expect(ps).toBeDefined();
      expect(ps.value).toBe('abcdef');
    });

    it('fails if the inner parser fails', function() {
      var ps = str(seq('abc', literalIC('def'))).parse(mkStream('abcghi'));
      expect(ps).toBeUndefined();
    });

  });

  describe('anyChar()', function() {
    it('should match any single character', function() {
      var ps = anyChar().parse(mkStream('a'));
      expect(ps).toBeDefined();
      expect(ps.value).toBe('a');
    });

    it('should match exactly one character', function() {
      var ps = anyChar().parse(mkStream('abc'));
      expect(ps).toBeDefined();
      expect(ps.value).toBe('a');
      expect(ps.head).toBe('b');
    });

    it('should fail on EOF', function() {
      expect(anyChar().parse(mkStream(''))).toBeUndefined();
    });
  });

  describe('repeatUntil()', function() {
    it('should return [] when the terminator passes immediately', function() {
      var p = repeatUntil(anyChar(), literal(';'));
      var res = p.parse(mkStream(';'));
      expect(res).toBeDefined();
      expect(res.value).toEqual([]);
    });

    it('should fail if both terminator and parser fail', function() {
      var p = repeatUntil(literal('a'), literal(';'));
      expect(p.parse(mkStream('aaab'))).toBeUndefined();
      expect(p.parse(mkStream('b'))).toBeUndefined();
    });

    it('should return an array of body results', function() {
      var p = seqAt(1, '"', repeatUntil(anyChar(), '"'));
      var res = p.parse(mkStream('"abcd"'));
      expect(res).toBeDefined();
      expect(res.value).toEqual(['a', 'b', 'c', 'd']);

      res = p.parse(mkStream('""'));
      expect(res).toBeDefined();
      expect(res.value).toEqual([]);
    });
  });

  describe('seq()', function() {
    var parser = seq('ab', literal('c'), literalIC('DEF'));

    it('should parse each argument in succession, returning an array',
        function() {
      var ps = parser.parse(mkStream('abcdefg'));
      expect(ps).toBeDefined();
      expect(ps.value).toEqual(['ab', 'c', 'DEF']);
      expect(ps.head).toBe('g');
    });

    it('should fail if any of the sub-parsers fails', function() {
      expect(parser.parse(mkStream('abcdegf'))).toBeUndefined();
      expect(parser.parse(mkStream('abdef'))).toBeUndefined();
    });

    it('should succeed with [] on an empty list', function() {
      var ps = seq().parse(mkStream(''));
      expect(ps).toBeDefined();
      expect(ps.value).toEqual([]);
    });

    it('should handle empty args correctly', function() {
      var ps = foam.parse.Sequence.create({args: null}).parse(mkStream(''));
      expect(ps).toBeDefined();
      expect(ps.value).toEqual([]);
    });
  });

  describe('seqAt()', function() {
    var parser = seqAt(1, '(', literalIC('DEF'), ')');

    it('should succeed when all sub-parsers do, and return exactly 1 value',
        function() {
      var ps = parser.parse(mkStream('(def)g'));
      expect(ps).toBeDefined();
      expect(ps.value).toBe('DEF');
      expect(ps.head).toBe('g');
    });

    it('should fail if any sub-parser does', function() {
      expect(parser.parse(mkStream('(defg'))).toBeUndefined();
    });
  });

  describe('optional()', function() {
    var parser = seq(optional('abc'), literalIC('DEF'));

    it('should parse its argument if possible', function() {
      var ps = parser.parse(mkStream('abcdefg'));
      expect(ps).toBeDefined();
      expect(ps.value).toEqual(['abc', 'DEF']);
      expect(ps.head).toBe('g');
    });

    it('should succeed (and return null) if its parser fails', function() {
      var ps = parser.parse(mkStream('defg'));
      expect(ps).toBeDefined();
      expect(ps.value).toEqual([null, 'DEF']);
      expect(ps.head).toBe('g');
    });
  });

  describe('notChars()', function() {
    it('should parse a single character not found in its argument', function() {
      var ps = notChars('abc').parse(mkStream('fg'));
      expect(ps).toBeDefined();
      expect(ps.value).toBe('f');
      expect(ps.head).toBe('g');
    });

    it('should fail to parse any character found in its argument', function() {
      expect(notChars('abc').parse(mkStream('a'))).toBeUndefined();
    });
  });

  describe('range()', function() {
    var parser = range('a', 'z');

    it('should parse a single character within the range', function() {
      var ps = parser.parse(mkStream('f!'));
      expect(ps).toBeDefined();
      expect(ps.value).toBe('f');
      expect(ps.head).toBe('!');
    });

    it('should be inclusive at the low end', function() {
      var ps = parser.parse(mkStream('a'));
      expect(ps).toBeDefined();
      expect(ps.value).toBe('a');
    });

    it('should be inclusive at the high end', function() {
      var ps = parser.parse(mkStream('z'));
      expect(ps).toBeDefined();
      expect(ps.value).toBe('z');
    });

    it('should fail on characters outside the range', function() {
      expect(parser.parse(mkStream('!'))).toBeUndefined();
    });

    it('should fail on EOF', function() {
      expect(parser.parse(mkStream(''))).toBeUndefined();
    });
  });

  describe('sym()', function() {
    var grammar = foam.parse.Grammar.create({
      symbols: function() {
        return {
          START: seq(sym('one'), sym('two')),
          one: literal('abc'),
          two: anyChar()
        };
      }
    }, foam.__context__);

    it('should include other rules in the grammar by name', function() {
      var res = grammar.parseString('abc!');
      expect(res).toEqual(['abc', '!']);
    });

    it('should error and fail parsing when a symbol is unknown', function() {
      var log = global.captureError();

      var g2 = foam.parse.Grammar.create({
        symbols: function() {
          return {
            START: sym('one')
          };
        }
      }, foam.__context__);

      expect(g2.parseString('abc')).toBeUndefined();
      expect(global.matchingLine(log(), 'No symbol found')).toBe(
          'No symbol found for one');
    });
  });

  describe('alt()', function() {
    var parser = alt(literal('abc'), literal('def'), literal('d'),
        literal('definitely'));

    it('should try each alternative in sequence, returning the first to match',
        function() {
      var ps = parser.parse(mkStream('abc'));
      expect(ps).toBeDefined();
      expect(ps.value).toBe('abc');

      ps = parser.parse(mkStream('def'));
      expect(ps).toBeDefined();
      expect(ps.value).toBe('def');

      ps = parser.parse(mkStream('de'));
      expect(ps).toBeDefined();
      expect(ps.value).toBe('d');
      expect(ps.head).toBe('e');

      // Note that alt() is greedy, and should match 'def', not 'definitely'.
      ps = parser.parse(mkStream('definitely'));
      expect(ps).toBeDefined();
      expect(ps.value).toBe('def');
      expect(ps.head).toBe('i');
    });

    it('should fail if all the alternatives do', function() {
      expect(parser.parse(mkStream('foam'))).toBeUndefined();
    });
  });

  describe('repeat()', function() {
    describe('without a separator', function() {
      it('should parse as many repetitions as possible', function() {
        var ps = repeat(notChars(';')).parse(mkStream('abc;'));
        expect(ps).toBeDefined();
        expect(ps.value).toEqual(['a', 'b', 'c']);
        expect(ps.head).toBe(';');
      });

      it('should succeed with an empty result for 0 repetitions', function() {
        var ps = repeat(notChars(';')).parse(mkStream(';'));
        expect(ps).toBeDefined();
        expect(ps.value).toEqual([]);
        expect(ps.head).toBe(';');
      });

      describe('with a minimum', function() {
        var parser = repeat(notChars(';'), undefined, 3);
        it('should succeed if there are least the minimum repetitions',
            function() {
          var ps = parser.parse(mkStream('abc;'));
          expect(ps).toBeDefined();
          expect(ps.value).toEqual(['a', 'b', 'c']);
          expect(ps.head).toBe(';');
        });

        it('should fail if there are less than the minimum repetitions',
            function() {
          expect(parser.parse(mkStream('ab;'))).toBeUndefined();
        });
      });
    });

    describe('with a separator', function() {
      it('should parse as many repetitions as possible', function() {
        var ps = repeat(notChars(',;'), literal(',')).parse(mkStream('a,b,c;'));
        expect(ps).toBeDefined();
        expect(ps.value).toEqual(['a', 'b', 'c']);
        expect(ps.head).toBe(';');
      });

      it('should succeed with an empty result for 0 repetitions', function() {
        var ps = repeat(notChars(',;'), literal(',')).parse(mkStream(';'));
        expect(ps).toBeDefined();
        expect(ps.value).toEqual([]);
        expect(ps.head).toBe(';');
      });

      describe('with a minimum', function() {
        var parser = repeat(notChars(',;'), literal(','), 3);

        it('should succeed if there are least the minimum repetitions',
            function() {
          var ps = parser.parse(mkStream('a,b,c;'));
          expect(ps).toBeDefined();
          expect(ps.value).toEqual(['a', 'b', 'c']);
          expect(ps.head).toBe(';');
        });

        it('should fail if there are less than the minimum repetitions',
            function() {
          expect(parser.parse(mkStream('ab;'))).toBeUndefined();
        });
      });
    });
  });

  describe('plus()', function() {
    describe('without a separator', function() {
      it('should parse as many repetitions as possible', function() {
        var ps = plus(notChars(';')).parse(mkStream('abc;'));
        expect(ps).toBeDefined();
        expect(ps.value).toEqual(['a', 'b', 'c']);
        expect(ps.head).toBe(';');
      });

      it('should fail for 0 repetitions', function() {
        var ps = plus(notChars(';')).parse(mkStream(';'));
        expect(ps).toBeUndefined();
      });
    });

    describe('with a separator', function() {
      it('should parse as many repetitions as possible', function() {
        var ps = plus(notChars(',;'), literal(',')).parse(mkStream('a,b,c;'));
        expect(ps).toBeDefined();
        expect(ps.value).toEqual(['a', 'b', 'c']);
        expect(ps.head).toBe(';');
      });

      it('should fail for 0 repetitions', function() {
        var ps = plus(notChars(',;'), literal(',')).parse(mkStream(';'));
        expect(ps).toBeUndefined();
      });
    });
  });

  describe('repeatDrop()', function() {
    var parser = repeatDrop(literal(' '));

    it('should parse many repetitions, and return null', function() {
      var ps = parser.parse(mkStream('   !'));
      expect(ps).toBeDefined();
      expect(ps.value).toBe(null);
      expect(ps.head).toBe('!');
    });

    it('should parse 0 repetitions correctly', function() {
      var ps = parser.parse(mkStream('!'));
      expect(ps).toBeDefined();
      expect(ps.value).toBe(null);
      expect(ps.head).toBe('!');
    });

    it('should handle delimiters', function() {
      var p2 = repeatDrop('a', ',');
      expect(p2.parse(mkStream('a,a,a,a'))).toBeDefined();
      expect(p2.parse(mkStream('a,a'))).toBeDefined();
      expect(p2.parse(mkStream('a'))).toBeDefined();
      expect(p2.parse(mkStream(''))).toBeDefined();
    });

    it('should respect the minimum without a delimiter', function() {
      var p2 = repeatDrop(' ', undefined, 4);
      expect(p2.parse(mkStream('        '))).toBeDefined();
      expect(p2.parse(mkStream('    '))).toBeDefined();
      expect(p2.parse(mkStream('   '))).toBeUndefined();
    });

    it('should respect the minimum with a delimiter', function() {
      var p2 = repeatDrop('a', ',', 2);
      expect(p2.parse(mkStream('a,a,a,a'))).toBeDefined();
      expect(p2.parse(mkStream('a,a'))).toBeDefined();
      expect(p2.parse(mkStream('a'))).toBeUndefined();
      expect(p2.parse(mkStream(''))).toBeUndefined();
    });
  });
});

describe('parser infrastructure', function() {
  describe('StringPS', function() {
    it('turns undefined values to null', function() {
      var ps = foam.parse.StringPS.create();
      ps = ps.setValue(undefined);
      expect(ps.value).toBe(null);
    });

    it('initializes and resets correctly on setString()', function() {
      var ps = foam.parse.StringPS.create();
      expect(ps.str).toBeUndefined();
      ps.setString('some string');
      expect(ps.str).toEqual(['some string']);
      expect(ps.value).toBe(null);

      ps.pos = 8;
      ps.setString('another string');
      expect(ps.str).toEqual(['another string']);
      expect(ps.pos).toBe(0);
    });
  });

  describe('foam.Parser static helpers', function() {
    it('should convert strings to literals', function() {
      var lit = foam.Parser.coerce('abc');
      expect(foam.parse.Literal.isInstance(lit)).toBe(true);
      expect(lit.literal).toBe('abc');
    });

    it('should return undefined if it can\'t coerce', function() {
      expect(foam.Parser.coerce([])).toBe(undefined);
    });
  });

  describe('actions', function() {
    it('supports adding actions one at a time or all at once', function() {
      var g = foam.parse.Grammar.create({
        symbols: function(range, repeat, seq, sym) {
          return {
            START: seq(sym('number'), '+', sym('number')),
            number: repeat(sym('digit')),
            digit: range('0', '9')
          };
        }
      }).addAction('START', function(as) { return as[0] + as[2]; });
      g.addActions({
        number: function(as) { return Number.parseInt(as.join('')); }
      });

      var value = g.parseString('77+192');
      expect(value).toBeDefined();
      expect(value).toBe(269);

      value = g.parseString('66');
      expect(value).toBeUndefined();
    });
  });

  describe('symbol table', function() {
    it('handles an array already filled', function() {
      var parsers = foam.parse.Parsers.create();
      var g = foam.parse.Grammar.create({
        symbols: [
          foam.parse.PSymbol.create({
            name: 'START',
            parser: parsers.seq(parsers.repeat(parsers.sym('one')),
              parsers.sym('two'))
          }),
          foam.parse.PSymbol.create({
            name: 'one',
            parser: parsers.range('a', 'z')
          }),
          foam.parse.PSymbol.create({
            name: 'two',
            parser: parsers.literal(';')
          })
        ]
      });

      expect(g.parseString('abc;')).toBeDefined();
      expect(g.parseString(';')).toBeDefined();
      expect(g.parseString('ab')).toBeUndefined();
    });

    it('handles a map', function() {
      var parsers = foam.parse.Parsers.create();
      var g = foam.parse.Grammar.create({
        symbols: {
          START: parsers.seq(parsers.repeat(parsers.sym('one')),
              parsers.sym('two')),
          one: parsers.range('a', 'z'),
          two: parsers.literal(';')
        }
      });

      expect(g.parseString('abc;')).toBeDefined();
      expect(g.parseString(';')).toBeDefined();
      expect(g.parseString('ab')).toBeUndefined();
    });

    it('throws if the symbol function is malformed', function() {
      var f = function() {};
      f.toString = function() { return 'This is not a function.'; };
      expect(function() {
        var g = foam.parse.Grammar.create({symbols: f});
      }).toThrow();
    });

    it('emits errors for duplicate symbols', function() {
      var log = global.captureError();
      var lit = foam.parse.Parsers.create().literal;
      var g = foam.parse.Grammar.create({
        symbols: [
          foam.parse.PSymbol.create({name: 'START', parser: lit('a')}),
          foam.parse.PSymbol.create({name: 'START', parser: lit('b')})
        ]
      });

      var res = g.parseString('a');
      expect(global.matchingLine(log(), 'Duplicate')).toBe(
          'Duplicate symbol found START');
    });
  });
});
