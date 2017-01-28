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

/* global test */
describe('Inner classes', function() {
  beforeEach(function() {
    foam.CLASS({
      package: 'test',
      name: 'Person',
      classes: [
        {
          name: 'InnerSelf',
          properties: [
            'me', 'myself', 'i'
          ]
        }
      ],

      properties: ['name', 'age', 'result'],

      methods: [
        function sayHello() {
          this.result = 'hello ' + this.name;
        }
      ]
    });
  });

  it('are installed on classes and prototypes', function() {
    expect(test.Person.InnerSelf).toBeDefined();
    var p = test.Person.create();
    expect(p.InnerSelf).toBeDefined();
  });

  it('support properties and methods normally', function() {
    var p = test.Person.create();
    var self = p.InnerSelf.create({me: 42, myself: 'me', i: 'plusplus'});
    expect(self.me).toBe(42);
    expect(self.myself).toBe('me');
    expect(self.i).toBe('plusplus');
  });

  it('can be whole models, not just skeletons', function() {
    foam.CLASS({
      package: 'test',
      name: 'InnerClassTest2',
      classes: [
        foam.core.Model.create({name: 'TheInnerClass', properties: ['a']})
      ]
    });

    expect(test.InnerClassTest2.TheInnerClass).toBeDefined();
    var t = test.InnerClassTest2.create();
    expect(t.TheInnerClass).toBeDefined();
    // Read it again to make sure the caching is working.
    expect(t.TheInnerClass).toBeDefined();
  });

  it('can be given directly', function() {
    foam.CLASS({
      package: 'test',
      name: 'InnerClassTest3',
      classes: [
        foam.core.InnerClass.create({
          model: {name: 'IC', properties: ['b']}
        })
      ]
    });

    expect(test.InnerClassTest3.IC).toBeDefined();
    var t = test.InnerClassTest3.create();
    expect(t.IC).toBeDefined();
  });
});
