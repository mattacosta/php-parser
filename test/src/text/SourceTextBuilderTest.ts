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

import { CompositeText } from '../../../src/text/CompositeText';
import { ISourceText } from '../../../src/text/SourceText';
import { SegmentedText } from '../../../src/text/SegmentedText';
import { SourceTextBuilder } from '../../../src/text/SourceTextBuilder';
import { SourceTextFactory } from '../../../src/text/SourceTextFactory';
import { StringText } from '../../../src/text/StringText';
import { TextSpan } from '../../../src/text/TextSpan';

class TestSourceTextBuilder extends SourceTextBuilder {

  constructor(segments?: ReadonlyArray<ISourceText>) {
    super(segments);
    // @ts-ignore Suppress TS2540: Override readonly property for testing purposes.
    SourceTextBuilder.MinSegmentLength = 4;
    // @ts-ignore Suppress TS2540: Override readonly property for testing purposes.
    SourceTextBuilder.MaxSegmentLength = 8;
    // @ts-ignore Suppress TS2540: Override readonly property for testing purposes.
    SourceTextBuilder.SegmentLimit = 4;
    // @ts-ignore Suppress TS2540: Override readonly property for testing purposes.
    SourceTextBuilder.SegmentRebuildLimit = 2;
  }

}

function createSourceTextList(...args: string[]): ISourceText[] {
  let segments = [];
  for (let arg of args) {
    segments.push(SourceTextFactory.from(arg));
  }
  return segments;
}

describe('SourceTextBuilder', function() {

  let characters = createSourceTextList(
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  );

  describe('#rebuildSegments()', function() {
    it('should merge segments to a specified length', () => {
      let builder = new TestSourceTextBuilder(characters.slice(0, 6));
      let text = <CompositeText>builder.toSourceText();
      assert.equal(text.sources.length, 2);
      assert.equal(text.sources[0].length, 4);
      assert.equal(text.sources[1].length, 2);
    });
    it('should not merge a large segment', () => {
      const short = SourceTextFactory.from('AB')
      const long = SourceTextFactory.from('1234567');
      // Last 3 elements are just padding to force a rebuild.
      let builder = new TestSourceTextBuilder([long, short, short, short, short]);
      let text = <CompositeText>builder.toSourceText();
      assert.equal(text.sources.length, 2);
      assert.equal(text.sources[0].length, 7);
      assert.equal(text.sources[1].length, 8);
    });
    it('should update source length', () => {
      const source = SourceTextFactory.from('12345');
      const segment = new SegmentedText(source, new TextSpan(0, 3));
      // Length is 5 + 3, source length is 5 + 5.
      let builder = new TestSourceTextBuilder(characters.slice(0, 5).concat(segment));
      let text = <CompositeText>builder.toSourceText();
      // Rebuild as 4 + (1 + 3).
      assert.equal(text.sourceLength, 8);
    });
  });

  describe('#toSourceText()', function() {
    it('should not rebuild if segment count is less than or equal to limit', () => {
      let text = new TestSourceTextBuilder(characters.slice(0, 4));
      let composite = <CompositeText>text.toSourceText();
      assert.equal(composite.sources.length, 4);
    });
    it('should rebuild if segment count is greater than limit', () => {
      let text = new TestSourceTextBuilder(characters.slice(0, 5));
      let composite = <CompositeText>text.toSourceText();
      assert.equal(composite.sources.length, 2);
    });
    it('should remove deleted text', () => {
      const source = SourceTextFactory.from('1234567890');
      let builder = new TestSourceTextBuilder([new SegmentedText(source, new TextSpan(0, 3))]);
      let text = <StringText>builder.toSourceText();
      // Always return the first merged segment.
      assert.equal(text instanceof StringText, true);
      assert.equal(text.length, 3);
      assert.equal(text.sourceLength, 3);
    });
  });

});
