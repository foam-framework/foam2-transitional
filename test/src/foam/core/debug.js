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


/* jshint -W014 */
/* jshint laxcomma:true */
// jscs:disable
function makeTestFn() {
  foam.CLASS({ name: 'TypeA' });
  foam.CLASS({ name: 'TypeB' });
  foam.CLASS({ name: 'TypeBB', extends: 'TypeB' });
  foam.CLASS({ name: 'TypeC', package: 'pkg' });
  foam.CLASS({ name: 'RetType' });
  return function test(/* TypeA // docs for, pA */ paramA, /*TypeB?*/ paramB
      , /* pkg.TypeC*/ paramC, noType /* RetType */ ) {
    return (global.RetType.create());
  };
}

function makePrimitiveTestFn() { // multiline parsing, ha
  return function(/* string */ str, /*boolean*/ bool ,
  /* function*/ func, /*object*/obj, /* number */num, /* array*/ arr ) {
    return ( true );
  };
}

function makeBodyCommentTestFn() { // multiline parsing, ha
  return function(str, bool) {
    /*
      A method
      @param {boolean} bool Is a nice boolean
      @arg {string} str Is a nice string
      @arg {number} another Additional arg
      @return {boolean} Returns true
    */
    return ( true );
  };
}

function makeInvalidBodyCommentTestFn() { // multiline parsing, ha
  return function(/*number*/str, bool) {
    /*
      A method
      @arg {string} str Dupe arg
    */
    return ( true );
  };
}
function makeInvalidReturnBodyCommentTestFn() { // multiline parsing, ha
  return function(str, bool /*number*/) {
    /*
      A method
      @return {string} Dupe return
    */
    return ( true );
  };
}

// jscs:enable
/* jshint laxcomma:false */
/* jshint +W014 */

describe('foam.types.getFunctionArgs', function() {
  var fn;

  beforeEach(function() {
    fn = makeTestFn();
  });
  afterEach(function() {
    fn = null;
  });

  it('returns the types of arguments', function() {
    var params = foam.types.getFunctionArgs(fn);

    expect(params[0].name).toEqual('paramA');
    expect(params[0].typeName).toEqual('TypeA');
    expect(params[0].optional).toBe(false);
    expect(params[0].documentation).toEqual('docs for, pA');

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
    var params = foam.types.getFunctionArgs(makeBodyCommentTestFn());

    expect(params[0].name).toEqual('str');
    expect(params[0].typeName).toEqual('string');
    expect(params[0].documentation).toEqual('Is a nice string');

    expect(params[1].name).toEqual('bool');
    expect(params[1].typeName).toEqual('boolean');
    expect(params[1].documentation).toEqual('Is a nice boolean');

    expect(params[2].name).toEqual('another');
    expect(params[2].typeName).toEqual('number');
    expect(params[2].documentation).toEqual('Additional arg');

    expect(params.returnType.typeName).toEqual('boolean');
  });

  it('rejects invalid duplicate body comment args', function() {
    expect(function() {
      foam.types.getFunctionArgs(makeInvalidBodyCommentTestFn());
    }).toThrow();

    expect(function() {
      foam.types.getFunctionArgs(makeInvalidReturnBodyCommentTestFn());
    }).toThrow();

  });

  it('accepts a return with no args', function() {
    var params = foam.types.getFunctionArgs(function(/*RetType*/) { });

    expect(params.returnType.typeName).toEqual('RetType');
  });

  it('reports parse failures', function() {
    fn = function(/*RetType*/) { };
    fn.toString = function() { return 'some garbage string!'; };

    expect(function() { foam.types.getFunctionArgs(fn); }).toThrow();
  });
  it('reports arg parse failures', function() {
    fn = function(/* */ arg) { };
    expect(function() { foam.types.getFunctionArgs(fn); }).toThrow();
  });
  it('reports return parse failures', function() {
    fn = function(/* */) { };
    expect(function() { foam.types.getFunctionArgs(fn); }).toThrow();
  });
  it('parses no args', function() {
    fn = function() { };

    expect(function() { foam.types.getFunctionArgs(fn); }).not.toThrow();
  });
  it('fails a return before the last arg', function() {
    // jscs:disable
    fn = function(arg1 /* RetType */, arg2) { };
    // jscs:enable
    expect(function() { foam.types.getFunctionArgs(fn); }).toThrow();
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
    var params = foam.types.getFunctionArgs(fn);

    expect(function() { params[1].validate(undefined); }).not.toThrow();
    expect(function() { params[2].validate(undefined); }).toThrow();
  });
  it('checks modelled types', function() {
    var params = foam.types.getFunctionArgs(fn);

    console.log(global.pkg.TypeC.create());
    console.log(foam.lookup('pkg.TypeC').create());
    console.log(global.pkg.TypeC.isInstance(global.pkg.TypeC.create()));

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
    var params = foam.types.getFunctionArgs(fn);

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
    var params = foam.types.getFunctionArgs(makePrimitiveTestFn());

    // /* string */ str, /*boolean*/ bool , /* function*/ func, /*object*/obj, /* number */num
    expect(function() { params[0].validate('hello'); }).not.toThrow();
    expect(function() { params[1].validate(true); }).not.toThrow();
    expect(function() { params[2].validate(function() {}); }).not.toThrow();
    expect(function() { params[3].validate({}); }).not.toThrow();
    expect(function() { params[4].validate(86); }).not.toThrow();
    expect(function() { params[5].validate([ 'hello' ]); }).not.toThrow();
  });
  it('rejects wrong primitive types', function() {
    var params = foam.types.getFunctionArgs(makePrimitiveTestFn());

    // /* string */ str, /*boolean*/ bool , /* function*/ func, /*object*/obj, /* number */num
    expect(function() { params[0].validate(78); }).toThrow();
    expect(function() { params[1].validate('nice'); }).toThrow();
    expect(function() { params[2].validate({}); }).toThrow();
    expect(function() { params[3].validate(function() {}); }).toThrow();
    expect(function() { params[4].validate(false); }).toThrow();
    expect(function() { params[5].validate({}); }).toThrow();
  });

  it('parses empty args list with tricky function body', function() {
    var params = foam.types.getFunctionArgs(
      function() { (3 + 4); return (1); });

    // /* string */ str, /*boolean*/ bool , /* function*/ func, /*object*/obj, /* number */num
    expect(function() { params[0].validate(78); }).toThrow();
    expect(function() { params[1].validate('nice'); }).toThrow();
    expect(function() { params[2].validate({}); }).toThrow();
    expect(function() { params[3].validate(function() {}); }).toThrow();
    expect(function() { params[4].validate(false); }).toThrow();
    expect(function() { params[5].validate({}); }).toThrow();
  });

});


describe('foam.types.typeCheck', function() {
  var fn;
  var orig;

  beforeEach(function() {
    orig = makeTestFn();
    fn = foam.types.typeCheck(orig);
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
    var rfn = foam.types.typeCheck(function(arg /* object */) {
      return arg;
    });
    expect(function() { rfn({}); }).not.toThrow();
    expect(function() { rfn(99); }).toThrow();
  });
  it('covers no return type', function() {
    var rfn = foam.types.typeCheck(function() { return 1; });
    expect(function() { rfn({}); }).not.toThrow();
  });
  it('does not affect the toString() of the function', function() {
    expect(orig.toString()).toEqual(fn.toString());
  });
  it('allows repeated args', function() {
    var rfn = foam.types.typeCheck(function(/* number* */ num) { return 1; });
    expect(function() { rfn(1); }).not.toThrow();
    expect(function() { rfn(1, 2); }).not.toThrow();
    expect(function() { rfn(1, 3, 4); }).not.toThrow();
    expect(function() { rfn(1, 'a'); }).toThrow();
  });

});