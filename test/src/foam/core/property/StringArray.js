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

var createTestProperties = function createTestProperties() {
  if ( ! foam.lookup('test.StringArrayTester', true) ) {
    foam.CLASS({
      name: 'StringArrayTester',
      package: 'test',

      properties: [
        {
          class: 'StringArray',
          name: 'stringArray',
        },
      ]
    });
  }

  return global.test.StringArrayTester.create(undefined, foam.__context__);
};



describe('StringArray', function() {
  var p;

  beforeEach(function() {
    p = createTestProperties();
  });
  afterEach(function() {
    p = null;
  });

  it('setting an array to a number throws an exception', function() {
    expect(function() { p.stringArray = 42; }).toThrow();
  });
  it('setting an array to null throws an exception', function() {
    expect(function() { p.stringArray = null; }).toThrow();
  });
  it('setting an array to an object throws an exception', function() {
    expect(function() { p.stringArray = {}; }).toThrow();
  });
  it('is empty array by default', function() {
    expect(p.stringArray).toEqual([]);
  });
  it('accepts string in an array', function() {
    p.stringArray = ['Hello', 'I see', 'Well'];
    expect(p.stringArray).toEqual(['Hello', 'I see', 'Well']);
  });
  it('converts elements to strings', function() {
    var d = new Date();
    var golden = '' + d;

    p.stringArray = [
      {a: 1},
      2,
      true,
      d,
      'hello'
    ];

    expect(p.stringArray).toEqual([
      '[object Object]',
      '2',
      'true',
      golden,
      'hello'
    ]);
  });
});
