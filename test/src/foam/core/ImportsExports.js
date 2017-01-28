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

// jshint undef:false
describe('imports exports', function() {
  it('properties', function() {
    foam.CLASS({
      name: 'Exporter',
      exports: [
        'a'
      ],
      properties: [
        'a'
      ]
    });

    foam.CLASS({
      name: 'Importer',
      imports: [
        'a'
      ]
    });

    var e = Exporter.create({a: 100});
    var i = Importer.create(null, e);

    expect(i.a).toBe(100);

    i.a = 12;

    expect(e.a).toBe(12);
  });

  it('export self', function() {
    foam.CLASS({
      name: 'Exporter',
      exports: [
        'as abc'
      ]
    });

    foam.CLASS({
      name: 'Importer',
      imports: [
        'abc'
      ]
    });

    var exporter = Exporter.create();
    var importer = Importer.create(null, exporter);

    // Exporter exported itself as abc.
    expect(importer.abc).toBe(exporter);
  });

  it('multiple exports', function() {
    foam.CLASS({
      name: 'Exporter',
      exports: [
        'a',
        'b',
        'c'
      ],
      properties: [
        'a',
        'b',
        'c'
      ]
    });

    foam.CLASS({
      name: 'Middle'
    });

    foam.CLASS({
      name: 'ImporterA',
      imports: [
        'a'
      ]
    });

    foam.CLASS({
      name: 'ImporterB',
      exports: [
        'c'
      ],
      imports: [
        'b'
      ],
      properties: [
        'c'
      ]
    });

    foam.CLASS({
      name: 'ImporterC',
      imports: [
        'c'
      ]
    });

    var exporter = Exporter.create({
      a: 1,
      b: 2,
      c: 3
    });

    var middle = Middle.create(null, exporter);

    var a = ImporterA.create(null, middle);

    var b = ImporterB.create({
      c: 'overridden'
    }, middle);

    // Should import the 'c' exported by Exporter
    var cOne = ImporterC.create(null, middle);

    // Should import the 'c' exported by ImporterB
    var cTwo = ImporterC.create(null, b);

    expect(a.a).toBe(1);
    expect(b.b).toBe(2);
    expect(cOne.c).toBe(3);
    expect(cTwo.c).toBe('overridden');
  });

  it('export as', function() {
    foam.CLASS({
      name: 'Exporter',
      exports: [
        'a as abc'
      ],
      properties: [
        'a'
      ]
    });

    foam.CLASS({
      name: 'Importer',
      imports: [
        'abc'
      ]
    });

    var e = Exporter.create({a: 1});

    var i = Importer.create(null, e);

    expect(i.abc).toBe(1);
  });

  it('validation', function() {
    // 'a a' is not valid syntax for an export
    expect(function() {
      foam.CLASS({
        name: 'Abc',
        exports: [
          'a a'
        ]
      });
    }).toThrow();

    // neither is 'a b c d'
    expect(function() {
      foam.CLASS({
        name: 'Abc',
        exports: [
          'a b c d'
        ]
      });
    }).toThrow();

    // Can only export valid axoims
    expect(function() {
      foam.CLASS({
        name: 'Abc',
        exports: [
          'a'
        ]
      });

      // Exports are validated on creation of subContext.
      Abc.create().__subContext__;
    }).toThrow();

    expect(function() {
      foam.CLASS({
        name: 'Abc',
        exports: [
          'a as b'
        ]
      });
    }).toThrow();
  });

  it('__subContext__ is only built once', function() {
    foam.CLASS({
      name: 'Exporter',
      exports: [
        'as Abc'
      ]
    });

    var obj = Exporter.create();
    var a = obj.__subContext__;
    var b = obj.__subContext__;

    expect(a).toBe(b);
  });


  // Never really used but supported for easier json serialization/deserialization
  it('long form imports/exports', function() {
    foam.CLASS({
      name: 'ImporterExporter',
      imports: [
        {
          name: 'a',
          key: 'a'
        }
      ],
      exports: [
        {
          exportName: 'someProperty',
          key: 'someProperty'
        }
      ],
      properties: [
        {
          name: 'someProperty'
        }
      ]
    });

    var context = foam.createSubContext({a: 12});
    var obj = ImporterExporter.create({someProperty: 'hello'}, context);

    expect(obj.a).toBe(12);
    expect(obj.__subContext__.someProperty$.get()).toBe('hello');
  });


  it('Exporting anonymous axioms', function() {
    foam.CLASS({
      name: 'Exporter',
      axioms: [
        {
          name: 'abc',
          installInProto: function(proto) {
            proto.abc = 123;
          }
        }
      ],
      exports: [
        'abc'
      ]
    });

    var obj = Exporter.create();
    expect(obj.__subContext__.abc$.get()).toBe(123);
  });

  it('optional imports', function() {
    foam.CLASS({
      name: 'Exporter',
      exports: [
        'a'
      ],
      properties: [
        {
          name: 'a',
          value: 1
        }
      ]
    });

    foam.CLASS({
      name: 'Importer',
      imports: [
        'a?',
        'c?'
      ]
    });

    var exporter = Exporter.create();
    var importer = Importer.create(null, exporter);

    expect(importer.a).toBe(1);
    expect(importer.c).toBe(undefined);
  });
});

describe('imports exports validation', function() {
  it('missing imports', function() {
    var log = captureWarn();
    foam.CLASS({
      name: 'Importer',
      imports: [
        'a?'
      ]
    });

    var obj = Importer.create();

    // Accessing a missing import does not throw an error if it was optional.
    expect(obj.a).toBe(undefined);
    expect(log()).toEqual([]);

    // Setting a missing import throws a warning
    log = captureWarn();
    expect(function() {
      obj.a = 123;
    }).toThrow();

    // Value is still un-set and no warning while reading.
    expect(obj.a).toBe(undefined);
    expect(log()).toEqual([]);
  });

  it('__subContext__ not settable', function() {
    foam.CLASS({
      name: 'Exporter',
      exports: ['as abc']
    });

    var obj = Exporter.create();
    expect(function() {
      obj.__subContext__ = foam.createSubContext({});
    }).toThrow();
  });

  it('name validation', function() {
    // Asserts missing imports on object creation
    expect(function() {
      foam.CLASS({
        name: 'Importer',
        imports: [
          'abc'
        ]
      });

      var obj = Importer.create();
    }).toThrow();

    // Name validation
    expect(function() {
      foam.CLASS({
        name: 'Importer',
        imports: [
          'some.invalid.import.name'
        ]
      });

      var obj = Importer.create();
    }).toThrow();

    expect(function() {
      foam.CLASS({
        name: 'Importer',
        imports: [
          '__another_invalid_name__'
        ]
      });

      var obj = Importer.create();
    }).toThrow();
  });

  it('duplicate import warnings', function() {
    var log = global.captureWarn();
    foam.CLASS({
      name: 'ImporterA',
      imports: [
        'a'
      ]
    });

    foam.CLASS({
      name: 'ImporterB',
      extends: 'ImporterA',
      imports: [
        'a'
      ]
    });

    expect(global.matchingLine(log(), 'already exists')).toBe(
        'Import "a" already exists in ancestor class of ImporterB.');

    // There is no warning if you import the same key as your parent,
    // but you import it 'as' a different name.  There is no conflict in this
    // case, you parent will import 'a' as 'a', and you can import 'a' as 'abc'.
    // In this case, this.a and this.abc will both be referring to 'a' in your
    // context.
    log = global.captureWarn();
    foam.CLASS({
      name: 'ImporterC',
      extends: 'ImporterA',
      imports: [
        'a as abc'
      ]
    });
    expect(log()).toEqual([]);
  });
});
