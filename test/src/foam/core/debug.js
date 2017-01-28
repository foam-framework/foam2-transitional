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

var suppressWarn;
global.beforeAll(function() {
  suppressWarn = global.captureWarn();
});
global.afterAll(function() {
  suppressWarn();
});

/* jshint -W014 */
/* jshint laxcomma:true */
// jscs:disable
function makeTestFn() {
  foam.CLASS({name: 'TypeA'});
  foam.CLASS({name: 'TypeB'});
  foam.CLASS({name: 'TypeBB', extends: 'TypeB'});
  foam.CLASS({name: 'TypeC', package: 'pkg'});
  foam.CLASS({name: 'RetType'});
  return function test(/* TypeA */ paramA, /*TypeB=*/ paramB
      , /* pkg.TypeC*/ paramC, noType /* RetType */ ) {
    return (global.RetType.create());
  };
}

function makePrimitiveTestFn() { // multiline parsing, ha
  return function(/* String */ str, /* Boolean*/ bool ,
  /* Function*/ func, /* Object*/obj, /* Number */num, /* Array */ arr ) {
    return ( true );
  };
}

function makeBodyCommentTestFn() { // multiline parsing, ha
  return function(str, bool) {
    /**
      A method
      @param {Boolean} bool Is a nice boolean
      @arg {String} str Is a nice string
      @arg {Number} another Additional arg
      @return {Boolean} Returns true
    */
    return ( true );
  };
}

function makeInvalidBodyCommentTestFn() { // multiline parsing, ha
  return function(/*Number*/str, bool) {
    /**
      A method
      @arg {String} str Dupe arg
    */
    return ( true );
  };
}
function makeInvalidReturnBodyCommentTestFn() { // multiline parsing, ha
  return function(str, bool /*Number*/) {
    /**
      A method
      @return {String} Dupe return
    */
    return ( true );
  };
}

// jscs:enable
/* jshint laxcomma:false */
/* jshint +W014 */

describe('foam.Function.args', function() {
  var fn;

  beforeEach(function() {
    fn = makeTestFn();
  });
  afterEach(function() {
    fn = null;
  });

  it('returns the types of arguments', function() {
    var params = foam.Function.args(fn);

    expect(params[0].name).toEqual('paramA');
    expect(params[0].typeName).toEqual('TypeA');
    expect(params[0].optional).toBe(false);

    expect(params[1].name).toEqual('paramB');
    expect(params[1].typeName).toEqual('TypeB');
    expect(params[1].optional).toBe(true);

    expect(params[2].name).toEqual('paramC');
    expect(params[2].typeName).toEqual('pkg.TypeC');
    expect(params[2].optional).toBe(false);

    expect(params[3].name).toEqual('noType');
    expect(params[3].typeName).toBeUndefined();
    expect(params[3].optional).toBe(false);

    expect(params.returnType.typeName).toEqual('RetType');

  });

  it('accepts body comments', function() {
    var params = foam.Function.args(makeBodyCommentTestFn());

    expect(params[0].name).toEqual('str');
    expect(params[0].typeName).toEqual('String');
    expect(params[0].documentation).toEqual('Is a nice string');

    expect(params[1].name).toEqual('bool');
    expect(params[1].typeName).toEqual('Boolean');
    expect(params[1].documentation).toEqual('Is a nice boolean');

    expect(params[2].name).toEqual('another');
    expect(params[2].typeName).toEqual('Number');
    expect(params[2].documentation).toEqual('Additional arg');

    expect(params.returnType.typeName).toEqual('Boolean');
  });

  it('rejects invalid duplicate body comment args', function() {
    expect(function() {
      foam.Function.args(makeInvalidBodyCommentTestFn());
    }).toThrow();

    expect(function() {
      foam.Function.args(makeInvalidReturnBodyCommentTestFn());
    }).toThrow();

  });

  it('accepts a return with no args', function() {
    var params = foam.Function.args(function(/*RetType*/) { });
    expect(params.returnType.typeName).toEqual('RetType');

    params = foam.Function.args(function(/* RetType= */) { });
    expect(params.returnType.typeName).toEqual('RetType');
    expect(params.returnType.optional).toEqual(true);
  });

  it('reports parse failures', function() {
    fn = function(/*RetType*/) { };
    fn.toString = function() { return 'some garbage string!'; };

    expect(function() { foam.Function.args(fn); }).toThrow();
  });
  it('reports arg parse failures', function() {
    fn = function(/* */ arg) { };
    expect(function() { foam.Function.args(fn); }).toThrow();
  });
  it('reports return parse failures', function() {
    fn = function(/* */) { };
    expect(function() { foam.Function.args(fn); }).toThrow();
  });
  it('parses no args', function() {
    fn = function() { };

    expect(function() { foam.Function.args(fn); }).not.toThrow();
  });
  it('fails a return before the last arg', function() {
    // jscs:disable
    fn = function(arg1 /* RetType */, arg2) { };
    // jscs:enable
    expect(function() { foam.Function.args(fn); }).toThrow();
  });

  it('fails an unknown type', function() {
    fn = function(/* crazyType */ arg2) { };
    expect(function() { foam.Function.args(fn); }).not.toThrow();
    expect(function() { foam.Function.args(fn)[0].type; }).toThrow();

    fn = function(/* foam.anotherCrazyLib */ arg2) { };
    expect(function() { foam.Function.args(fn); }).not.toThrow();
    expect(function() { foam.Function.args(fn)[0].type; }).toThrow();
  });

});

describe('Argument.validate', function() {
  var fn;

  beforeEach(function() {
    fn = makeTestFn();
  });
  afterEach(function() {
    fn = null;
  });

  it('allows optional args to be omitted', function() {
    var params = foam.Function.args(fn);

    expect(function() { params[1].validate(undefined); }).not.toThrow();
    expect(function() { params[2].validate(undefined); }).toThrow();
  });
  it('checks modelled types', function() {
    var params = foam.Function.args(fn);

    global.pkg.TypeC.create();
    foam.lookup('pkg.TypeC').create();
    global.pkg.TypeC.isInstance(global.pkg.TypeC.create());

    expect(function() { params[0].validate(global.TypeA.create()); })
      .not.toThrow();
    expect(function() { params[1].validate(global.TypeB.create()); })
      .not.toThrow();
    expect(function() { params[1].validate(global.TypeBB.create()); })
      .not.toThrow(); //subclass should be ok
    expect(function() { params[2].validate(global.pkg.TypeC.create()); })
      .not.toThrow();

    expect(function() { params[3].validate(global.TypeA.create()); })
      .not.toThrow(); // arg 3 not typed
    expect(function() { params[3].validate(99); })
      .not.toThrow();

    expect(function() { params.returnType.validate(global.RetType.create()); })
      .not.toThrow();
  });
  it('rejects wrong modelled types', function() {
    var params = foam.Function.args(fn);

    expect(function() { params[0].validate(global.TypeB.create()); })
      .toThrow();
    expect(function() { params[1].validate(global.TypeA.create()); })
      .toThrow();
    expect(function() { params[2].validate(global.RetType.create()); })
      .toThrow();

    expect(function() {
      params.returnType.validate(global.pkg.TypeC.create());
    }).toThrow();
  });
  it('checks primitive types', function() {
    var params = foam.Function.args(makePrimitiveTestFn());

    // /* String */ str, /* Boolean*/ bool , /* Function*/ func, /* Object*/obj, /* Number */num
    expect(function() { params[0].validate('hello'); }).not.toThrow();
    expect(function() { params[1].validate(true); }).not.toThrow();
    expect(function() { params[2].validate(function() {}); }).not.toThrow();
    expect(function() { params[3].validate({}); }).not.toThrow();
    expect(function() { params[4].validate(86); }).not.toThrow();
    expect(function() { params[5].validate(['hello']); }).not.toThrow();
  });
  it('rejects wrong primitive types', function() {
    var params = foam.Function.args(makePrimitiveTestFn());

    // /* String */ str, /* Boolean*/ bool , /* Function*/ func, /* Object*/obj, /* Number */num
    expect(function() { params[0].validate(78); }).toThrow();
    expect(function() { params[1].validate('nice'); }).toThrow();
    expect(function() { params[2].validate({}); }).toThrow();
    expect(function() { params[3].validate(function() {}); }).toThrow();
    expect(function() { params[4].validate(false); }).toThrow();
    expect(function() { params[5].validate({}); }).toThrow();
  });

  it('parses empty args list with tricky function body', function() {
    var params = foam.Function.args(
      function() { (3 + 4); return (1); });

    // /* String */ str, /* Boolean*/ bool , /* Function*/ func, /* Object*/obj, /* Number */num
    expect(function() { params[0].validate(78); }).toThrow();
    expect(function() { params[1].validate('nice'); }).toThrow();
    expect(function() { params[2].validate({}); }).toThrow();
    expect(function() { params[3].validate(function() {}); }).toThrow();
    expect(function() { params[4].validate(false); }).toThrow();
    expect(function() { params[5].validate({}); }).toThrow();
  });

});


describe('foam.Function.typeCheck', function() {
  var fn;
  var orig;

  beforeEach(function() {
    orig = makeTestFn();
    fn = foam.Function.typeCheck(orig);
  });
  afterEach(function() {
    fn = null;
  });

  it('allows valid args', function() {
    expect(function() {
      fn(global.TypeA.create(), global.TypeB.create(),
        global.pkg.TypeC.create(), 99);
    }).not.toThrow();
  });
  it('allows extra args', function() {
    expect(function() {
      fn(global.TypeA.create(), global.TypeB.create(),
        global.pkg.TypeC.create(), 99, 'extra', 8, 'arg');
    }).not.toThrow();
  });
  it('fails missing args', function() {
    expect(function() {
      fn(global.TypeA.create(), global.TypeB.create());
    }).toThrow();
  });
  it('fails invalid types for args at call time', function() {
    var invalidFn = foam.Function.typeCheck(function(arg1) {
      /** @param {foo.bar.wert.not.a.Type} arg1 */
    });
    expect(function() {
      invalidFn();
    }).toThrow();
  });
  it('fails bad primitive args', function() {
    expect(function() {
      fn(global.TypeA.create(), 3, global.pkg.TypeC.create(), 99);
    }).toThrow();
  });
  it('fails bad model args', function() {
    expect(function() {
      fn(global.TypeA.create(), global.TypeB.create(),
        global.TypeA.create(), 99);
    }).toThrow();
  });

  it('fails bad return type', function() {
    var rfn = foam.Function.typeCheck(function(arg /* Object */) {
      return arg;
    });
    expect(function() { rfn({}); }).not.toThrow();
    expect(function() { rfn(99); }).toThrow();
  });
  it('covers no return type', function() {
    var rfn = foam.Function.typeCheck(function() { return 1; });
    expect(function() { rfn({}); }).not.toThrow();
  });
  it('does not affect the toString() of the function', function() {
    expect(orig.toString()).toEqual(fn.toString());
  });
  it('allows repeated args', function() {
    var rfn = foam.Function
      .typeCheck(function(/* ...Number */ num) { return 1; });
    expect(function() { rfn(); }).not.toThrow();
    expect(function() { rfn(1); }).not.toThrow();
    expect(function() { rfn(1, 2); }).not.toThrow();
    expect(function() { rfn(1, 3, 4); }).not.toThrow();
    expect(function() { rfn(1, 'a'); }).toThrow();
  });
  it('allows repeated ES2016 ...rest arguments', function() {
    var restFn = function() {};
    // Support old node by faking the toString
    restFn.toString = function() {
      return 'function(arg1, /*Number*/ ...num) { return 1; }';
    };
    var rfn = foam.Function.typeCheck(restFn);

    expect(function() { rfn('arg1'); }).not.toThrow();
    expect(function() { rfn('arg1', 2); }).not.toThrow();
    expect(function() { rfn('arg1', 3, 4); }).not.toThrow();
    expect(function() { rfn('arg1', 2, 'a'); }).toThrow();
  });
  it('avoids double-checking', function() {
    expect(foam.Function.typeCheck(fn)).toBe(fn);
  });
  it('avoids installing checker when nothing to check', function() {
    var nofn = function(/* any= */ one, /* ...any */two) { return 1; };
    expect(foam.Function.typeCheck(nofn)).toBe(nofn);

    var nofnret = function(/* any= */) { return 1; };
    expect(foam.Function.typeCheck(nofnret)).toBe(nofnret);
  });

  it('accepts explicit arguments list', function() {
    var args = [foam.core.Argument.create({
      name: 'str',
      typeName: 'String',
      index: 0
    })];

    var rfn = foam.Function
      .typeCheck(function(/* Number */ num) { return 1; }, args);

    expect(rfn.isTypeChecked__).toBe(true);
    expect(function() { rfn(22); }).toThrow();
    expect(function() { rfn('1, 2'); }).not.toThrow();
  });
});

describe('Method type checking', function() {

  it('accepts valid methods', function() {
    var capture = global.captureWarn();
    foam.CLASS({
      name: 'GoodMethods',
      package: 'test',
      methods: [
        {
          name: 'method1',
          code: makePrimitiveTestFn()
        }
      ]
    });
    test.GoodMethods;

    expect(test.GoodMethods.create().method1.isTypeChecked__)
      .toBe(true);
    capture();
  });
  it('rejects invalid methods', function() {
    var capture = global.captureWarn();

    expect(function() {
      foam.CLASS({
        name: 'BadMethods',
        package: 'test',
        methods: [
          {
            name: 'method2',
            code: makeInvalidBodyCommentTestFn()
          }
        ]
      });
      test.BadMethods;
    }).toThrow();
  });
  it('ignores undefined methods', function() {
    var capture = global.captureWarn();
    var m = foam.core.Method.create({name: 'undefCode', code: null});
    expect(m.code).toBe(null);
    capture();
  });
  it('accepts explicit args methods', function() {
    //var capture = global.captureWarn();
    foam.CLASS({
      name: 'ExpMethods',
      package: 'test',
      methods: [
        {
          name: 'method3',
          code: function() {},
          args: [
            {
              name: 'arg1',
              typeName: 'String'
            },
            {
              name: 'arg2',
              typeName: 'Number'
            }
          ]
        }
      ]
    });

    var inst = test.ExpMethods.create();
    expect(test.ExpMethods.create().method3.isTypeChecked__)
      .toBe(true);
    // Explicit arguments
    expect(function() { inst.method3('str', 88); }).not.toThrow();
    expect(function() { inst.method3(99, 'not number'); }).toThrow();


  });

  it('rejects bad implicit args', function() {
    //var capture = global.captureWarn();
    expect(function() {
      foam.CLASS({
        name: 'ExpMethods',
        package: 'test',
        methods: [
          {
            name: 'method3',
            code: function(/*String.wee*/arg1) {
              /**
                @param {Number} arg1
              */
            }
          }
        ]
      });
      test.ExpMethods;
    }).toThrow();

  });

});

/* globals test */
describe('installModel validation', function() {
  it('warns on changing the property type', function() {
    var capture = global.captureWarn();
    foam.CLASS({
      package: 'test',
      name: 'Parent',
      properties: [
        {class: 'Int', name: 'foo'}
      ]
    });

    foam.CLASS({
      package: 'test',
      name: 'Child',
      extends: 'test.Parent',
      properties: [
        {class: 'String', name: 'foo'}
      ]
    });

    var t = test.Child.create();
    var log = capture();
    expect(global.matchingLine(log, 'Change of Axiom')).toBe(
        'Change of Axiom test.Child.foo type from foam.core.property.Int to ' +
        'foam.core.property.String');
  });

  it('throws when a property changes to a non-Property', function() {
    foam.CLASS({
      package: 'test',
      name: 'Parent',
      properties: ['foo']
    });
    expect(function() {
      foam.CLASS({
        package: 'test',
        name: 'Child',
        extends: 'test.Parent',
        methods: [
          function foo() {}
        ]
      });
    }).toThrow();
  });

  it('throws when two axioms on the same class have the same name', function() {
    expect(function() {
      foam.CLASS({
        package: 'test',
        name: 'Child',
        properties: ['foo'],
        methods: [
          function foo() {}
        ]
      });
    }).toThrow();
  });

  it('does not complain if the parent axiom has no class', function() {
    expect(function() {
      foam.CLASS({
        package: 'test',
        name: 'Parent',
        axioms: [
          {
            name: 'foo',
            installInClass: function() {}
          }
        ]
      });

      foam.CLASS({
        package: 'test',
        name: 'Child',
        extends: 'test.Parent',
        methods: [
          function foo() {}
        ]
      });
    }).not.toThrow();
  });

  it('does not complain if the child axiom has no class', function() {
    // We get a warning for changing a method to an anonymous type, but we
    // need to try this to get coverage for the "anonymous" case where the
    // child axiom has no class.
    // So we suppress the warning to keep it out of the test output.
    var log = global.captureWarn();

    expect(function() {
      foam.CLASS({
        package: 'test',
        name: 'Parent',
        methods: [
          function foo() {}
        ]
      });

      foam.CLASS({
        package: 'test',
        name: 'Child',
        extends: 'test.Parent',
        axioms: [
          {
            name: 'foo',
            installInClass: function() {}
          }
        ]
      });

    }).not.toThrow();

    expect(global.matchingLine(log(), 'Change of Axiom')).toBe(
        'Change of Axiom test.Child.foo type from foam.core.Method to anonymous'
    );
  });
});
