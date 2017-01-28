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
  Topics declare the types of events that an object pub()s.
<pre>
  Ex.
  foam.CLASS({
    name: 'Alarm',
    topics: ['ring']
  });

  then doing:
  alarm.ring.pub();
  alarm.ring.sub(l);

  is the same as:
  alarm.pub('ring');
  alarm.sub('ring', l);
</pre>
*/
foam.CLASS({
  package: 'foam.core',
  name: 'Topic',

  properties: [
    'name',
    'documentation',
    {
      /**
       * An array of subtopics. These are added as children of the outer topic,
       * eg.
       * <pre>
       * foam.CLASS({
       *   package: 'test',
       *   name: 'TopicExample',
       *   topics: [
       *     {
       *       name: 'on',
       *       topics: [
       *         'event'
       *       ]
       *     }
       *   ]
       * });
       * var t = test.TopicExample.create();
       * t.on.event.pub();
       * </pre>
       */
      class: 'FObjectArray',
      of: 'Topic',
      name: 'topics',
      adaptArrayElement: function(o) {
        return typeof o === 'string' ?
            foam.core.Topic.create({name: o}, this) :
            foam.core.Topic.create(o, this);
      }
    }
  ],

  methods: [
    function installInProto(proto) {
      /** @param {any} proto */

      var name      = this.name;
      var topic     = this;
      var makeTopic = this.makeTopic;

      Object.defineProperty(proto, name, {
        get: function topicGetter() {
          if ( ! this.hasOwnPrivate_(name) ) {
            this.setPrivate_(name, makeTopic(topic, this));
          }

          return this.getPrivate_(name);
        },
        configurable: true,
        enumerable: false
      });
    },

    function makeTopic(topic, parent) {
      /**
       * Constructs topic objects bound to instances of the model that owns this
       * Topic.
       * @param {Object} topic
       * @param {FObject} parent
       */

      var name   = topic.name;
      var topics = topic.topics;

      var ret = {
        pub: parent.pub.bind(parent, name),
        sub: parent.sub.bind(parent, name),
        hasListeners: parent.hasListeners.bind(parent, name),
        toString: function() { return 'Topic(' + name + ')'; }
      };

      for ( var i = 0 ; i < topics.length ; i++ ) {
        ret[topics[i].name] = makeTopic(topics[i], ret);
      }

      return ret;
    }
  ]
});

foam.CLASS({
  refines: 'foam.core.Model',
  properties: [
    {
      class: 'AxiomArray',
      of: 'Topic',
      name: 'topics',
      adaptArrayElement: function(o) {
        return typeof o === 'string'        ?
            foam.core.Topic.create({name: o}) :
            foam.core.Topic.create(o);
      }
    }
  ]
});

foam.CLASS({
  refines: 'foam.core.FObject',
  topics: ['propertyChange']
});
