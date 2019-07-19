/**
 * Copyright 2017 Matt Acosta
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

'use strict';

import * as assert from 'assert';

import { TextSpan } from '../../../src/text/TextSpan';

describe('TextSpan', function() {

  const large  = new TextSpan(2, 6);  // 0 1 { 2 3 4 5 6 7 } 8 9
  const medium = new TextSpan(3, 4);  // 0 1 2 { 3 4 5 6 } 7 8 9
  const small  = new TextSpan(4, 2);  // 0 1 2 3 { 4 5 } 6 7 8 9

  describe('#constructor()', function() {
    it('should throw if start is negative', () => {
      assert.throws(() => new TextSpan(-1, 0));
    });
    it('should throw if length is negative', () => {
      assert.throws(() => new TextSpan(0, -1));
    });
  });

  describe('#compareTo()', function() {
    it('should be less than span before start', () => {
      let a = new TextSpan(0, 2);
      let b = new TextSpan(1, 2);
      assert.equal(a.compareTo(b), -1);
    });
    it('should be less than larger span', () => {
      let a = new TextSpan(2, 2);
      let b = new TextSpan(2, 3);
      assert.equal(a.compareTo(b), -1);
    });
    it('should be equal to equivalent span', () => {
      assert.equal(medium.compareTo(medium), 0);
    });
    it('should be greater than span after start', () => {
      let a = new TextSpan(2, 2);
      let b = new TextSpan(2, 3);
      assert.equal(b.compareTo(a), 1);
    });
    it('should be greater than smaller span', () => {
      let a = new TextSpan(2, 2);
      let b = new TextSpan(2, 3);
      assert.equal(b.compareTo(a), 1);
    })
  });

  // Is all of span B in span A?
  describe('#contains()', function() {
    it('should contain an equivalent span', () => {
      assert.equal(medium.contains(medium), true);
    });
    it('should not contain a larger span', () => {
      assert.equal(medium.contains(large), false);
    });
    it('should contain a smaller span', () => {
      assert.equal(medium.contains(small), true);
    });

    it('should not contain span before start', () => {
      assert.equal(medium.contains(new TextSpan(2, 4)), false);
    });
    it('should not contain span after end', () => {
      assert.equal(medium.contains(new TextSpan(4, 4)), false);
    });
    it('should not contain span ending at start', () => {
      assert.equal(medium.contains(new TextSpan(0, 2)), false);
    });
    it('should not contain span starting at end', () => {
      assert.equal(medium.contains(new TextSpan(8, 2)), false);
    });
    it('should not contain span ending before start', () => {
      assert.equal(medium.contains(new TextSpan(0, 1)), false);
    });
    it('should not contain span starting after end', () => {
      assert.equal(medium.contains(new TextSpan(9, 1)), false);
    });

    it('should not contain an offset before start', () => {
      assert.equal(medium.contains(2), false);
    });
    it('should contain an offset at start', () => {
      assert.equal(medium.contains(3), true);
    });
    it('should contain an offset in span', () => {
      assert.equal(medium.contains(5), true);
    });
    it('should not contain an offset at end', () => {
      assert.equal(medium.contains(7), false);
    });
    it('should not contain offset after end', () => {
      assert.equal(medium.contains(8), false);
    });
  });

  describe('#intersection()', function() {
    it('should intersect with an equivalent span', () => {
      assert.equal(medium.intersection(medium)!.equals(medium), true);
    });
    it('should intersect with a larger span', () => {
      assert.equal(medium.intersection(large)!.equals(medium), true);
    });
    it('should intersect with a smaller span', () => {
      assert.equal(medium.intersection(small)!.equals(small), true);
    });

    it('should intersect with span before start', () => {
      assert.equal(medium.intersection(new TextSpan(2, 4))!.equals(new TextSpan(3, 3)), true);
    });
    it('should intersect with span after end', () => {
      assert.equal(medium.intersection(new TextSpan(4, 4))!.equals(new TextSpan(4, 3)), true);
    });
    it('should intersect with span ending at start', () => {
      assert.equal(medium.intersection(new TextSpan(1, 2))!.equals(new TextSpan(3, 0)), true);
    });
    it('should intersect with span starting at end', () => {
      assert.equal(medium.intersection(new TextSpan(7, 2))!.equals(new TextSpan(7, 0)), true);
    });
    it('should not intersect with span ending before start', () => {
      assert.strictEqual(medium.intersection(new TextSpan(0, 2)), null);
    });
    it('should not intersect with span starting after end', () => {
      assert.strictEqual(medium.intersection(new TextSpan(8, 2)), null);
    });
  });

  // Is part of span B in or adjacent to span A?
  describe('#intersectsWith()', function() {
    it('should intersect with an equivalent span', () => {
      assert.equal(medium.intersectsWith(medium), true);
    });
    it('should intersect with a larger span', () => {
      assert.equal(medium.intersectsWith(large), true);
    });
    it('should intersect with a smaller span', () => {
      assert.equal(medium.intersectsWith(small), true);
    });

    it('should intersect with span before start', () => {
      assert.equal(medium.intersectsWith(new TextSpan(2, 4)), true);
    });
    it('should intersect with span after end', () => {
      assert.equal(medium.intersectsWith(new TextSpan(4, 4)), true);
    });
    it('should intersect with span ending at start', () => {
      assert.equal(medium.intersectsWith(new TextSpan(1, 2)), true);
    });
    it('should intersect with span starting at end', () => {
      assert.equal(medium.intersectsWith(new TextSpan(7, 2)), true);
    });
    it('should not intersect with span ending before start', () => {
      assert.equal(medium.intersectsWith(new TextSpan(0, 2)), false);
    });
    it('should not intersect with span starting after end', () => {
      assert.equal(medium.intersectsWith(new TextSpan(8, 2)), false);
    });

    it('should intersect with an offset at start', () => {
      assert.equal(medium.intersectsWith(3), true);
    });
    it('should intersect with an offset at end', () => {
      assert.equal(medium.intersectsWith(7), true);
    });
  });

  describe('#overlap()', function() {
    it('should overlap with an equivalent span', () => {
      assert.equal(medium.overlap(medium)!.equals(medium), true);
    });
    it('should overlap with a larger span', () => {
      assert.equal(medium.overlap(large)!.equals(medium), true);
    });
    it('should overlap with a smaller span', () => {
      assert.equal(medium.overlap(small)!.equals(small), true);
    });

    it('should overlap with span before start', () => {
      assert.equal(medium.overlap(new TextSpan(2, 4))!.equals(new TextSpan(3, 3)), true);
    });
    it('should overlap with span after end', () => {
      assert.equal(medium.overlap(new TextSpan(4, 4))!.equals(new TextSpan(4, 3)), true);
    });
    it('should not overlap with span ending at start', () => {
      assert.strictEqual(medium.overlap(new TextSpan(1, 2)), null);
    });
    it('should not overlap with span starting at end', () => {
      assert.strictEqual(medium.overlap(new TextSpan(7, 2)), null);
    });
    it('should not overlap with span ending before start', () => {
      assert.strictEqual(medium.overlap(new TextSpan(0, 2)), null);
    });
    it('should not overlap with span starting after end', () => {
      assert.strictEqual(medium.overlap(new TextSpan(8, 2)), null);
    });
    it('should not overlap with an empty span', () => {
      assert.strictEqual(medium.overlap(new TextSpan(3, 0)), null);
      assert.strictEqual(medium.overlap(new TextSpan(7, 0)), null);
    });
  });

  // Is part of span B in span A?
  describe('#overlapsWith()', function() {
    it('should overlap with an equivalent span', () => {
      assert.equal(medium.overlapsWith(medium), true);
    });
    it('should overlap with a larger span', () => {
      assert.equal(medium.overlapsWith(large), true);
    });
    it('should overlap with a smaller span', () => {
      assert.equal(medium.overlapsWith(small), true);
    });

    it('should overlap with span before start', () => {
      assert.equal(medium.overlapsWith(new TextSpan(2, 4)), true);
    });
    it('should overlap with span after end', () => {
      assert.equal(medium.overlapsWith(new TextSpan(4, 4)), true);
    });
    it('should not overlap with span ending at start', () => {
      assert.equal(medium.overlapsWith(new TextSpan(1, 2)), false);
    });
    it('should not overlap with span starting at end', () => {
      assert.equal(medium.overlapsWith(new TextSpan(7, 2)), false);
    });
    it('should not overlap with span ending before start', () => {
      assert.equal(medium.overlapsWith(new TextSpan(0, 2)), false);
    });
    it('should not overlap with span starting after end', () => {
      assert.equal(medium.overlapsWith(new TextSpan(8, 2)), false);
    });
    it('should not overlap with an empty span', () => {
      assert.equal(medium.overlapsWith(new TextSpan(3, 0)), false);
      assert.equal(medium.overlapsWith(new TextSpan(7, 0)), false);
    });
  });

});
