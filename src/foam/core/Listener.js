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
  Listeners are high-level pre-bound event call-backs.
<pre>
  Ex.
  foam.CLASS({
    name: 'Sprinkler',
    listeners: [
      // short-form
      function onAlarm() { ... },

      // long-form
      {
        name: 'onClear',
        code: function() { ... }
      }
    ]
  });
</pre>
  You might use the above onAlarm listener like this:
  alarm.ring.sub(sprinker.onAlarm);
<p>
  Notice, that normally JS methods forget which object they belong
  to so you would need to do something like:
    <pre>alarm.ring.sub(sprinker.onAlarm.bind(sprinkler));</pre>
  but listeners are pre-bound to the object they came from.

  Listeners support merging, whereby a execution of the listener is
  deferred and batched for a number of miliseconds.
*/
foam.CLASS({
  package: 'foam.core',
  name: 'Listener',
  extends: 'foam.core.AbstractMethod',

  properties: [
    {
      class: 'Boolean',
      name: 'isMerged',
      value: false
    },
    {
      class: 'Int',
      name: 'mergeDelay',
      value: 16,
      units: 'ms'
    }
  ],

  methods: [
    function installInProto(proto) {
      /** @param {any} proto */

      var superAxiom = proto.cls_.getSuperAxiomByName(this.name);

      foam.assert(
        ! superAxiom ||
          foam.core.Listener.isInstance(superAxiom),
        'Attempt to override non-listener', this.name);

      var name = this.name;
      var code = this.override_(proto, foam.Function.setName(this.code, name));
      var isMerged = this.isMerged;
      var mergeDelay = this.mergeDelay;

      Object.defineProperty(proto, name, {
        get: function listenerGetter() {
          if ( this.cls_.prototype === this ) return code;

          if ( ! this.hasOwnPrivate_(name) ) {
            var self = this;
            var l = function(sub) {
              // FUTURE: Detect if this call is coming from a stale subscription.
              // A stale subscription is a when objA subscribes to objB, and objA
              // gets .detach()'d, but the subscription to objB wasn't added to
              // objA.onDetach(), then the subscription is considered 'stale'
              // and shouldn't actually trigger the listener code.
              code.apply(self, arguments);
            };

            if ( isMerged ) {
              l = this.__context__.merged(l, mergeDelay);
            }

            this.setPrivate_(name, l);
          }

          return this.getPrivate_(name);
        },
        configurable: true,
        enumerable: false
      });
    }
  ]
});


foam.CLASS({
  refines: 'foam.core.Model',

  properties: [
    {
      class: 'AxiomArray',
      of: 'Listener',
      name: 'listeners',
      adaptArrayElement: function(o) {
        if ( typeof o === 'function' ) {
          foam.assert(o.name, 'Listener must be named');
          return foam.core.Listener.create({name: o.name, code: o});
        }

        return foam.core.Listener.create(o);
      }
    }
  ]
});
