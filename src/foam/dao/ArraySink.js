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
 * Simple Sink that just <tt>push()</tt>es each value onto an array.
 *
 * You can access that inner array as <tt>mySink.array</tt>:
 *
 * ArraySink is the default sink returned by a DAO when you don't provide a
 * sink:
 *
 * <pre>
 * someDAO.select().then(function(arraySink) {
 *   console.log(arraySink.array);
 * });
 * </pre>
 */
foam.CLASS({
  package: 'foam.dao',
  name: 'ArraySink',
  implements: ['foam.dao.Sink'],

  properties: [
    {
      /** The array of results that have been sent to this sink. */
      name: 'array',
      factory: function() { return []; }
    }
  ],

  methods: [
    function put(o) {
      /**
       * Called with each value returned by the DAO. Just <tt>push()</tt>es
       * them to <tt>array</tt>.
       * @param {any} o
       */
      this.array.push(o);
    }
  ]
});
