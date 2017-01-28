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
describe('Property', function() {
  it('flyweight get/set', function() {
    foam.CLASS({
      name: 'Abc',
      properties: [
        'camelCaseName'
      ]
    });

    var obj = Abc.create({camelCaseName: 1});

    expect(Abc.CAMEL_CASE_NAME.get(obj)).toBe(1);

    Abc.CAMEL_CASE_NAME.set(obj, 2);

    expect(obj.camelCaseName).toBe(2);
  });

  it('toString', function() {
    foam.CLASS({
      name: 'Abc',
      properties: [
        'prop'
      ]
    });

    expect(Abc.PROP.toString()).toBe('prop');
  });

  it('validate', function() {
    expect(function() {
      var prop = foam.core.Property.create({
        name: ''
      });

      prop.validate();
    }).toThrow();
  });

  it('validate names', function() {
    expect(function() {
      foam.CLASS({
        name: 'SomeClass',
        properties: [
          {
            name: 'illegalName$'
          }
        ]
      });

      var obj = SomeClass.create();
    }).toThrow();
  });

  it('as map function', function() {
    foam.CLASS({
      name: 'SomeClass',
      properties: [
        {
          name: 'a',
          value: 12
        }
      ]
    });

    var obj = SomeClass.create();

    expect(SomeClass.A.evaluate(obj)).toBe(12);
  });

  it('comparison', function() {
    foam.CLASS({
      name: 'SomeClass',
      properties: [
        {
          class: 'Int',
          name: 'intProp'
        },
        {
          class: 'String',
          name: 'stringProp'
        },
        {
          name: 'otherProp',
          value: 12
        }
      ]
    });

    var objA = SomeClass.create({
      intProp: 1,
      stringProp: 'z'
    });

    var objB = SomeClass.create({
      intProp: 99999,
      stringProp: 'a'
    });


    // 1 < 9999 so a comparison of objA and objB based upon
    // INT_PROP gives objA is less than objB
    expect(SomeClass.INT_PROP.compare(objA, objB) < 0).toBe(true);

    // z > a so a comparison of objA and objB based upon
    // STRING_PROP gives objA is greater than objB
    expect(SomeClass.STRING_PROP.compare(objA, objB) > 0).toBe(true);

    // otherProp is equal for both objA and objB so a comparison based upon
    // OTHER_PROP gives objA === objB
    expect(SomeClass.OTHER_PROP.compare(objA, objB) === 0).toBe(true);
  });

  it('shadowing parent to child', function() {
    foam.CLASS({
      name: 'ParentClass',
      properties: [
        {
          name: 'a',
          factory: function() {
            return 1;
          }
        }
      ]
    });

    foam.CLASS({
      name: 'ChildClass',
      extends: 'ParentClass',
      properties: [
        {
          name: 'a',
          value: 123
        }
      ]
    });

    var parent = ParentClass.create();
    var child = ChildClass.create();

    expect(parent.a).toBe(1);
    expect(child.a).toBe(123);
  });


  beforeEach(function() {
  });

  afterEach(function() {
  });

  it('shadowing in same class warns', function() {
    var capture = global.captureWarn();

    foam.CLASS({
      name: 'SomeClass',
      properties: [
        {
          name: 'a',
          getter: function() { return 1; },
          value: 2
        }
      ]
    });

    global.matchingLine(capture(),
      'Property SomeClass.a "value" hidden by "getter"');

    var obj = SomeClass.create();

    // getter takes precedence
    expect(obj.a).toBe(1);
  });
});
