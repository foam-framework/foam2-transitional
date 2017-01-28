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

/* globals test */
describe('topics', function() {
  it('get added to prototypes', function() {
    foam.CLASS({
      package: 'test',
      name: 'TopicTest',
      topics: ['testEvent'],
    });

    var t = test.TopicTest.create();
    var called = false;
    expect(t.testEvent).toBeDefined();
    t.testEvent.sub(function() { called = true; });
    expect(called).toBe(false);
    t.testEvent.pub();
    expect(called).toBe(true);
  });

  it('can be pubbed and hit named subs', function() {
    foam.CLASS({
      package: 'test',
      name: 'TopicTest',
      topics: ['testEvent'],
    });

    var called = false;
    var t = test.TopicTest.create();
    t.sub('testEvent', function() { called = true; });
    expect(called).toBe(false);
    t.testEvent.pub();
    expect(called).toBe(true);
  });

  it('can be subbed and hit by named subs', function() {
    foam.CLASS({
      package: 'test',
      name: 'TopicTest',
      topics: ['testEvent'],
    });

    var called = false;
    var t = test.TopicTest.create();
    t.testEvent.sub(function() { called = true; });
    expect(called).toBe(false);
    t.pub('testEvent');
    expect(called).toBe(true);
  });

  it('toString() nicely', function() {
    foam.CLASS({
      package: 'test',
      name: 'TopicTest',
      topics: [{name: 'testEvent'}],
    });

    var t = test.TopicTest.create();
    expect(t.testEvent.toString()).toBe('Topic(testEvent)');
  });

  it('support nested topics', function() {
    foam.CLASS({
      package: 'test',
      name: 'TopicTest',
      topics: [
        {
          name: 'foo',
          topics: ['bar', {name: 'baz'}]
        }
      ]
    });

    var t = test.TopicTest.create();
    expect(t.foo).toBeDefined();
    expect(t.foo.bar).toBeDefined();

    var called = false;
    t.foo.sub(function() { called = true; });
    expect(called).toBe(false);
    t.foo.bar.pub();
    expect(called).toBe(true);
  });
});
