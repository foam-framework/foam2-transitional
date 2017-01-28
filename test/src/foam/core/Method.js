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
describe('Method', function() {
  foam.CLASS({
    package: 'test.method',
    name: 'Parent',

    properties: ['calls'],

    methods: [
      function bumpCalls() {
        this.calls++;
      }
    ]
  });

  foam.CLASS({
    package: 'test.method',
    name: 'Child',
    extends: 'test.method.Parent',

    properties: ['childCalls'],

    methods: [
      function bumpCalls() {
        this.SUPER();
        this.childCalls++;
      }
    ]
  });

  it('supports SUPER', function() {
    var obj = foam.lookup('test.method.Child').create({
      calls: 0,
      childCalls: 0
    });

    expect(obj.calls).toBe(0);
    expect(obj.childCalls).toBe(0);

    obj.bumpCalls();

    expect(obj.calls).toBe(1);
    expect(obj.childCalls).toBe(1);
  });

  it('should throw if the parent doesn\'t define this method',
      function() {
    expect(function() {
      foam.CLASS({
        package: 'test.method',
        name: 'Child2',
        methods: [
          function notInParent() {
            this.SUPER();
          }
        ]
      });
      var obj = foam.lookup('test.method.Child2').create();
      obj.notInParent();
    }).toThrow();
  });

  it('can trigger a false positive and try to support SUPER when it should not',
      function() {
    expect(function() {
      foam.CLASS({
        package: 'test.method',
        name: 'Child3',
        methods: [
          function someMethod() {
            console.log('A false positive: mention SUPER but don\'t call.');
          }
        ]
      });
    }).toThrow();
  });

  it('should not try to support SUPER if you set usesSuper to false',
      function() {
    expect(function() {
      foam.CLASS({
        package: 'test.method',
        name: 'Child3',
        methods: [
          {
            name: 'someMethod',
            usesSuper: false,
            code: function() {
              console.log('A false positive: mention SUPER but don\'t call.');
            }
          }
        ]
      });
    }).not.toThrow();
  });

  it('should emit the original on a toString', function() {
    var obj = foam.lookup('test.method.Child').create();
    expect(obj.bumpCalls.toString()).toBe(
        'function bumpCalls() {\n' +
        '        this.SUPER();\n' +
        '        this.childCalls++;\n' +
        '      }');
  });

  it('Is bound when exported', function() {
    foam.CLASS({
      name: 'SomeClass',
      properties: ['a'],
      exports: ['getA'],
      methods: [
        function getA() {
          return this.a;
        }
      ]
    });


    var obj = SomeClass.create({a: 123});
    var getA = obj.__subContext__.getA;

    expect(getA()).toBe(123);
  });
});
