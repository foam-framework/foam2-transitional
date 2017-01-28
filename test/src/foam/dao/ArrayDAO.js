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
describe('ArrayDAO', function() {
  var people;

  beforeEach(function() {
    foam.CLASS({
      package: 'test',
      name: 'Person',
      properties: [
        'id',
        'name'
      ]
    });

    people = [
      test.Person.create({id: 1, name: 'Kevin'}),
      test.Person.create({id: 2, name: 'Adam'}),
      test.Person.create({id: 3, name: 'Braden'}),
      test.Person.create({id: 4, name: 'Jackson'})
    ];
  });

  afterEach(function() {
    people = null;
  });

  it('returns an empty result when freshly created', function(done) {
    var dao = foam.dao.ArrayDAO.create({of: 'test.Person'});
    dao.select().then(function(sink) {
      expect(sink).toBeDefined();
      expect(sink.array).toEqual([]);
      done();
    });
  });

  it('accepts put()s', function(done) {
    var dao = foam.dao.ArrayDAO.create({of: 'test.Person'});
    Promise.all(people.map(dao.put.bind(dao))).then(function() {
      return dao.select();
    }).then(function(sink) {
      expect(sink.array.length).toBe(4);
      expect(sink.array[0]).toBe(people[0]);
      expect(sink.array[1]).toBe(people[1]);
      expect(sink.array[2]).toBe(people[2]);
      expect(sink.array[3]).toBe(people[3]);
      done();
    });
  });

  it('handles remove()', function(done) {
    var dao = foam.dao.ArrayDAO.create({of: 'test.Person'});
    Promise.all(people.map(dao.put.bind(dao))).then(function() {
      return dao.select();
    }).then(function(sink) {
      expect(sink.array.length).toBe(4);
    }).then(function() {
      return dao.remove(people[2]);
    }).then(function() {
      return dao.select();
    }).then(function(sink) {
      expect(sink.array.length).toBe(3);
      expect(sink.array[0]).toEqual(people[0]);
      expect(sink.array[1]).toEqual(people[1]);
      // And the tricky one:
      expect(sink.array[2]).toEqual(people[3]);
      done();
    });
  });

  it('returns values on find()', function(done) {
    var dao = foam.dao.ArrayDAO.create({of: 'test.Person'});
    Promise.all(people.map(dao.put.bind(dao))).then(function() {
      return dao.find(2);
    }).then(function(obj) {
      expect(obj).toEqual(people[1]);
      done();
    });
  });

  it('returns null on a failed find()', function(done) {
    var dao = foam.dao.ArrayDAO.create({of: 'test.Person'});
    Promise.all(people.map(dao.put.bind(dao))).then(function() {
      return dao.find(8);
    }).then(function(obj) {
      expect(obj).toBe(null);
      done();
    });
  });

  it('updates on put() if IDs match', function(done) {
    var dao = foam.dao.ArrayDAO.create({of: 'test.Person'});
    Promise.all(people.map(dao.put.bind(dao))).then(function() {
      var p = test.Person.create({id: 2, name: 'AdamVY'});
      return dao.put(p);
    }).then(function() {
      return dao.find(2);
    }).then(function(obj) {
      expect(obj).not.toEqual(people[1]);
      expect(obj.name).toBe('AdamVY');
      done();
    });
  });

  it('empties itself on removeAll()', function(done) {
    var dao = foam.dao.ArrayDAO.create({of: 'test.Person'});
    Promise.all(people.map(dao.put.bind(dao))).then(function() {
      return dao.select();
    }).then(function(sink) {
      expect(sink.array.length).toBe(4);
      return dao.removeAll();
    }).then(function() {
      return dao.select();
    }).then(function(sink) {
      expect(sink.array.length).toBe(0);
      done();
    });
  });

  it('uses your sink if you provide one', function(done) {
    var dao = foam.dao.ArrayDAO.create({of: 'test.Person'});
    var putCalls = 0;
    var eofCalled = false;

    foam.CLASS({
      package: 'test',
      name: 'Sink',
      implements: ['foam.dao.Sink'],
      methods: [
        function put() { putCalls++; },
        function eof() { eofCalled = true; }
      ]
    });
    var sink = test.Sink.create();

    Promise.all(people.map(dao.put.bind(dao))).then(function() {
      return dao.select(sink);
    }).then(function(s) {
      expect(s).toBe(sink);
      expect(putCalls).toBe(4);
      expect(eofCalled).toBe(true);
      done();
    });
  });

  it('succeeds when removing an unknown item', function(done) {
    var newPerson = test.Person.create({id: 8, name: 'Alex'});
    var dao = foam.dao.ArrayDAO.create({of: 'test.Person'});
    Promise.all(people.map(dao.put.bind(dao))).then(function() {
      return dao.remove(newPerson);
    }).then(function() {
      expect(true).toBe(true);
      done();
    }, function() {
      fail('Failed to remove unknown item');
    });
  });

  it('publishes onData.put on each put', function(done) {
    var puts = 0;
    var dao = foam.dao.ArrayDAO.create({of: 'test.Person'});
    dao.onData.put.sub(function() { puts++; });
    expect(puts).toBe(0);

    Promise.all(people.map(dao.put.bind(dao))).then(function() {
      expect(puts).toBe(4);
      return dao.remove(people[1]);
    }).then(function() {
      expect(puts).toBe(4);
      return dao.put(people[1]);
    }).then(function() {
      expect(puts).toBe(5);

      // Update an entry and put() it.
      people[2].name = 'James';
      return dao.put(people[2]);
    }).then(function() {
      expect(puts).toBe(6);
      done();
    });
  });

  it('publishes onData.remove on each remove', function(done) {
    var removes = 0;
    var dao = foam.dao.ArrayDAO.create({of: 'test.Person'});
    dao.onData.remove.sub(function() { removes++; });
    expect(removes).toBe(0);

    Promise.all(people.map(dao.put.bind(dao))).then(function() {
      expect(removes).toBe(0);
      return dao.remove(people[1]);
    }).then(function() {
      expect(removes).toBe(1);
      return dao.put(people[1]);
    }).then(function() {
      expect(removes).toBe(1);
      return dao.remove(people[0]);
    }).then(function() {
      expect(removes).toBe(2);
      return dao.removeAll();
    }).then(function() {
      expect(removes).toBe(5);
      done();
    });
  });

  it('publishes onData.reset when the array is replaced', function(done) {
    var resets = 0;
    var dao = foam.dao.ArrayDAO.create({of: 'test.Person'});
    dao.onData.reset.sub(function() { resets++; });
    expect(resets).toBe(0);

    Promise.all(people.map(dao.put.bind(dao))).then(function() {
      expect(resets).toBe(0);
      return dao.remove(people[1]);
    }).then(function() {
      expect(resets).toBe(0);
      dao.array = [];
      expect(resets).toBe(1);
      done();
    });
  });
});
