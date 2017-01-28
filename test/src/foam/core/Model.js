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
describe('Model properties', function() {
  it('clearProperty', function() {
    foam.CLASS({
      name: 'Abc',
      properties: [
        {
          name: 'a',
          value: 'hello'
        }
      ]
    });

    var obj = Abc.create();
    expect(obj.a).toBe('hello');

    obj.a = 'foo';

    expect(obj.a).toBe('foo');

    obj.a = undefined;

    expect(obj.a).toBe('hello');

    obj.a = 'bar';

    expect(obj.a).toBe('bar');

    obj.clearProperty('a');

    expect(obj.a).toBe('hello');
  });

  it('upgraded to real axioms properly during adapt', function() {
    var realProp = foam.core.Property.create({
      name: 'realProp'
    });

    foam.CLASS({
      name: 'Abc',
      properties: [
        realProp,
        {
          name: 'longFormProp'
        },
        ['mediumFormProp', ''],
        'shortFormProp'
      ]
    });

    var properties = Abc.model_.properties;

    // Ensure the real property was not upgraded to another instance of Property
    expect(Abc.REAL_PROP).toBe(realProp);

    expect(foam.core.Property.isInstance(properties[1])).toBe(true);
    expect(foam.core.Property.isInstance(properties[2])).toBe(true);
  });

  it('custom properties are respected', function() {
    foam.CLASS({
      package: 'test',
      name: 'MyProperty',
      extends: 'Property'
    });

    foam.CLASS({
      package: 'test',
      name: 'MyClass',
      properties: [
        {
          class: 'test.MyProperty',
          name: 'myProperty'
        }
      ]
    });

    expect(test.MyProperty.isInstance(test.MyClass.MY_PROPERTY)).toBe(true);
  });

  it('property inheritence', function() {
    foam.CLASS({
      name: 'CustomProperty',
      extends: 'Property',
      properties: [
        {
          name: 'adapt',
          value: function(_, nu) {
            return nu * 2;
          }
        }
      ]
    });

    foam.CLASS({
      name: 'Parent',
      properties: [
        {
          class: 'CustomProperty',
          name: 'a',
          value: 1
        }
      ]
    });

    foam.CLASS({
      name: 'Child',
      extends: 'Parent',
      properties: [
        {
          name: 'a',
          postSet: function() {
            this.b = this.a;
          }
        },
        {
          name: 'b'
        }
      ]
    });

    var base = Parent.create();

    expect(base.a).toBe(1);

    // Default adapt that multiplies by 2 should be included.
    base.a = 2;
    expect(base.a).toBe(4);

    var obj = Child.create();

    // Type of parent property is preserved if child type is unspecified
    expect(CustomProperty.isInstance(Child.A)).toBe(true);

    // Default value should be inherited.
    expect(obj.a).toBe(1);

    obj.a = 12;

    // Default adapt should have been inherited
    expect(obj.a).toBe(24);

    // Post set should have been added.
    expect(obj.b).toBe(24);
  });

  it('cannot have properties with conflicting constant names', function() {
    expect(function() {
      foam.CLASS({
        name: 'Abc',
        axioms: [
          {
            name: 'foo',
            installInClass: function(cls) {
              cls.ABC = 'SOME_CONSTANT';
            }
          }
        ],
        properties: [
          'abc'
        ]
      });
    }).toThrow();
  });

  it('getter/setter', function() {
    foam.CLASS({
      name: 'Abc',
      properties: [
        {
          name: 'a',
          getter: function() { return 'hello ' + this.instance_.a; },
          setter: function(value) { this.instance_.a = 'there ' + value; }
        }
      ]
    });

    var obj = Abc.create({a: 'world'});

    expect(obj.a).toBe('hello there world');
  });

  it('adapt/preSet/assertValue/postSet', function() {
    foam.CLASS({
      name: 'Abc',
      properties: [
        {
          name: 'a',
          adapt: function(_, a) {
            // Convert to string.
            return '' + a;
          },
          preSet: function(old, nu) {
            return '[' + old + '],' + nu;
          },
          assertValue: function(v) {
            foam.assert(
              v !== '[[[undefined],123],456],789',
              "Cannot set to '[[[undefined],123],456],789'");
          },
          postSet: function(old, nu) {
            foam.assert(
              this.a === nu,
              'Post set called, but nu is not the current value');

            this.b = [
              old,
              nu
            ];
          }
        },
        {
          name: 'b'
        }
      ]
    });

    var obj = Abc.create();


    // Adapt is called first and converts value to a string.
    obj.a = 123;

    // 'a' hasn't been set before so the old value is undefined
    // resulting in preSet setting the value to as follows.
    expect(obj.a).toBe('[undefined],123');

    // Setting again through the adapt/preSet flow,
    // will result in this.
    obj.a = 456;
    expect(obj.a).toBe('[[undefined],123],456');

    // postSet fires after preSet/adapt and results in 'b' being set as follows.
    expect(obj.b).toEqual([
      '[undefined],123',
      '[[undefined],123],456'
    ]);

    // assertValue is called after preSet, resulting in an exception in this case.
    // Since adapt converts the number 789 to the string '789' and
    // preSet pre-pends the old value of [[undefined],123],456" resulting in the
    // specific
    expect(function() {
      obj.a = 789;
    }).toThrow();

    // Ensure the value wasn't set since assertValue rejected it.
    expect(obj.a).toBe('[[undefined],123],456');
  });

  it('factory/value', function() {
    foam.CLASS({
      name: 'Abc',
      properties: [
        {
          name: 'withValue',
          value: 123
        },
        {
          name: 'withFactory',
          factory: function() {
            return {a: 456};
          }
        }
      ]
    });

    var obj1 = Abc.create();
    var obj2 = Abc.create();

    // value specifies the default value you get when accessing an unset property.
    expect(obj1.withValue).toBe(123);
    // But hasOwnProperty returns false since it hasn't been set.
    expect(obj1.hasOwnProperty('withValue')).toBe(false);

    // factory specifies a factory to run that returns a value which is set to the property
    expect(obj1.withFactory).toEqual({a: 456});

    // properties initialized with a factory are considered to be "set"
    expect(obj1.hasOwnProperty('withFactory')).toBe(true);

    // obj2 will also have an equivalent value for 'withFactory'
    expect(obj2.withFactory).toEqual({a: 456});

    // However the factory is run for each instance of Abc, so
    // the two objects have different actual objects for their
    // 'withFactory' property.
    expect(obj1.withFactory).not.toBe(obj2.withFactory);
  });

  it('factory is not run if initialized with a value', function() {
    var preSetCalled = false;
    var expectedOldValue;

    foam.CLASS({
      name: 'Abc',
      properties: [
        {
          name: 'prop',
          preSet: function(oldValue, newValue) {
            expect(oldValue).toBe(expectedOldValue);
            preSetCalled = true;
            return newValue;
          },
          factory: function() {
            throw 'Factory should not be run.';
          }
        }
      ]
    });


    // First time through the preSet, oldValue should be undefined
    // as the factory shouldn't be run.
    expectedOldValue = undefined;
    var obj = Abc.create({prop: 1});
    expect(preSetCalled).toBe(true);

    // Second time through the preSet, oldValue should be the
    // value we set it to via .create()
    expectedOldValue = 1;
    preSetCalled = false;
    obj.prop = 2;
    expect(preSetCalled).toBe(true);
  });
});

describe('Model methods', function() {
  it('upgraded to real axioms properly during adapt', function() {
    var realMethod = foam.core.Method.create({
      name: 'realMethod',
      code: function() {}
    });

    foam.CLASS({
      name: 'Abc',
      methods: [
        realMethod,
        function shortFormMethod() {},
        {
          name: 'longFormMethod',
          code: function() {}
        }
      ]
    });

    var methods = Abc.model_.methods;

    // Ensure the real method was no upgraded to another instance of Method
    expect(Abc.getAxiomByName('realMethod')).toBe(realMethod);

    expect(foam.core.Method.isInstance(methods[1])).toBe(true);
    expect(foam.core.Method.isInstance(methods[2])).toBe(true);
  });
});

describe('Model generic axioms', function() {
  it('can define anonymous axioms using axioms: property', function() {
    foam.CLASS({
      name: 'Abc',
      axioms: [
        {
          name: 'foo',
          installInClass: function(cls) {
            cls.FOOBAR = 'from class';
          },
          installInProto: function(proto) {
            proto.FOOBAR = 'from proto';
          }
        }
      ]
    });

    var obj = Abc.create();

    expect(Abc.FOOBAR).toBe('from class');
    expect(obj.FOOBAR).toBe('from proto');
  });

  it('axioms factory works', function() {
    foam.CLASS({
      name: 'Abc'
    });

    expect(Abc.model_.axioms).toEqual([]);
  });
});

describe('Model inheritance', function() {
  it('isSubClass and isInstance', function() {
    foam.CLASS({
      name: 'ParentClass'
    });

    foam.CLASS({
      name: 'ChildClass',
      extends: 'ParentClass'
    });

    foam.CLASS({
      name: 'NotChildClass'
    });

    expect(ParentClass.isSubClass(ChildClass)).toBe(true);
    expect(ParentClass.isSubClass(NotChildClass)).toBe(false);

    var child = ChildClass.create();
    var notChild = NotChildClass.create();

    expect(ParentClass.isInstance(child)).toBe(true);
    expect(ParentClass.isInstance(notChild)).toBe(false);
  });

  it('errors on unknown parent', function() {
    expect(function() {
      foam.CLASS({
        name: 'SomeClass',
        extends: 'SomeUnknownClass'
      });
    }).toThrow();
  });
});


describe('Model validation checks', function() {
  it('Property names', function() {
    expect(function() {
      foam.CLASS({
        name: 'SomeClass',
        properties: [
          'illegal$'
        ]
      });
    }).toThrow();

    expect(function() {
      foam.CLASS({
        name: 'SomeClass',
        properties: [
          '__illegal'
        ]
      });
    }).toThrow();
  });

  it('extends and refines are mutually exclusive', function() {
    expect(function() {
      foam.CLASS({
        name: 'TargetClass'
      });

      foam.CLASS({
        name: 'IllegalClass',
        extends: 'TargetClass',
        refines: 'TargetClass'
      });
    }).toThrow();
  });
});
