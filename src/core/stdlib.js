/*
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
 * Top-Level of foam package
 */
foam = {
  isServer: typeof process === 'object',
  core:     {},
  next$UID: (function() {
    /* Return a unique id. */
    var id = 1;
    return function next$UID() {
      return id++;
    }
  })()
};

/** Setup nodejs-like 'global' on web */
if ( ! foam.isServer ) global = this;

Object.defineProperty(
  Object.prototype,
  '$UID',
  {
    get: function() {
      if ( Object.hasOwnProperty.call(this, '$UID__') ) return this.$UID__;
      Object.defineProperty(this, '$UID__', {value: foam.next$UID(), enumerable: false});
      return this.$UID__;
    },
    enumerable: false
  }
);


/**
 * Creates a small library in the foam package. A LIB is a collection of static constants,
 * methods and functions.
 * <pre>
foam.LIB({
  name: 'network',
  constants: {
    PORT: 4000
  },
  methods: [ function sendPacket() { ... }  ]
});
</pre>
Produces <code>foam.network</code>:
<pre>
console.log(foam.network.PORT); // outputs 4000
foam.network.sendPacket();
</pre>
 * @method LIB
 * @memberof module:foam
 */
foam.LIB = function LIB(model) {
  function defineProperty(proto, key, map) {
    if ( ! map.value )
      Object.defineProperty.apply(this, arguments);
    else
      proto[key] = map.value;
  }

  var proto = model.name ? foam[model.name] || ( foam[model.name] = {} ) : foam;

  if ( model.constants ) {
    console.assert(typeof model.constants === 'object',
                   'Constants must be a map.');

    for ( var key in model.constants ) {
      defineProperty(
        proto,
        key,
        { value: model.constants[key], writable: true, enumerable: false });
    }
  }

  if ( model.methods ) {
    console.assert(Array.isArray(model.methods), 'Methods must be an array.');

    for ( var i = 0 ; i < model.methods.length ; i++ ) {
      var m = model.methods[i];
      defineProperty(
        proto,
        m.name,
        { value: m.code || m, writable: true, enumerable: false });
    }
  }
};
