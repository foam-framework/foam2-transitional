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


/**
 * Implementation of the DAO interface backed by a simple array.
 *
 * This is an impoverished version that doesn't support where(), skip(),
 * limit(), or orderBy(). It does support select() (for selecting everything),
 * put(), remove(), find() and removeAll().
 *
 * <pre>
 * var dao = foam.dao.ArrayDAO.create({of: 'example.MyModel'});
 * Promise.all(
 *   dao.put(example.MyModel.create({foo: 7})),
 *   dao.put(example.MyModel.create({foo: 9}))
 * ).then(function() {
 *   return dao.select();
 * }).then(function(arraySink) {
 *   console.log(arraySink.a);
 * });
 * </pre>
 */
foam.CLASS({
  package: 'foam.dao',
  name: 'ArrayDAO',
  implements: ['foam.dao.DAO'],
  //extends: 'foam.dao.AbstractDAO',

  requires: [
    'foam.dao.ArraySink'
  ],

  topics: [
    {
      name: 'onData',
      topics: ['put', 'remove', 'reset']
    }
  ],

  properties: [
    {
      /** The class of the items added to the DAO. */
      name: 'of',
      required: true
    },
    {
      /** The internal array used for storage. */
      name: 'array',
      factory: function() { return []; }
    }
  ],

  methods: [
    function init() {
      this.SUPER();
      // Emit an onData.reset event when the array is replaced.
      // This doesn't fire when the factory is called the first time.
      this.array$.sub(function() { this.onData.reset.pub(); }.bind(this));
    },
    function put(obj) {
      /** @param {FObject} obj */

      var index = this.indexOf_(obj.id);
      if ( index >= 0 ) {
        this.array[index] = obj;
      } else {
        this.array.push(obj);
      }

      this.onData.put.pub(obj);
      return Promise.resolve(obj);
    },

    function remove(obj) {
      /** @param {FObject} obj */
      var index = this.indexOf_(obj.id);
      if ( index >= 0 ) {
        var o2 = this.array.splice(index, 1)[0];
        this.onData.remove.pub(o2);
      }

      return Promise.resolve();
    },

    function select(sink) {
      /**
       * @param {foam.dao.Sink=} sink
       */
      var resultSink = sink || this.ArraySink.create();

      for ( var i = 0 ; i < this.array.length ; i++ ) {
        resultSink.put(this.array[i]);
      }
      resultSink.eof();
      return Promise.resolve(resultSink);
    },

    function removeAll() {
      for ( var i = 0; i < this.array.length; i++ ) {
        var obj = this.array.splice(i, 1)[0];
        i--;
        this.onData.remove.pub(obj);
      }

      return Promise.resolve();
    },

    function find(id) {
      /** @param {any} id */
      var index = this.indexOf_(id);
      return Promise.resolve(index >= 0 ? this.array[index] : null);
    },

    function indexOf_(id) {
      /** @param {any} id */
      for ( var i = 0; i < this.array.length; i++ ) {
        if ( this.array[i].cls_.ID.comparePropertyValues(
            this.array[i].id, id) === 0 ) {
          return i;
        }
      }
      return -1;
    }
  ]
});
