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
import { Encoding } from '../../../src/text/Encoding';
import { ISourceText } from '../../../src/text/ISourceText';
import { SourceTextBuilder } from '../../../src/text/SourceTextBuilder';
import { SourceTextFactory } from '../../../src/text/SourceTextFactory';
import { StringText } from '../../../src/text/StringText';
import { TextSpan } from '../../../src/text/TextSpan';

class TestSourceTextBuilder extends SourceTextBuilder {

  constructor(segments?: ReadonlyArray<ISourceText>) {
    // The builder should always maintain this non-default encoding.
    super(Encoding.Latin1);

    SourceTextBuilder.MinSegmentLength = 4;
    SourceTextBuilder.MaxSegmentLength = 8;
    SourceTextBuilder.ReducedSegmentTarget = 2;
    SourceTextBuilder.SegmentLimit = 4;

    if (segments !== undefined) {
      for (let segment of segments) {
        this.append(segment);
      }
    }
  }

}

function assertSourceText(text: ISourceText, expectedText: string, expectedEncoding = Encoding.Latin1): void {
  assert.equal(text.substring(0), expectedText);
  assert.equal(text.length, expectedText.length);
  assert.equal(Encoding[text.encoding], Encoding[expectedEncoding]);
}

function createSourceTextList(...args: string[]): ISourceText[] {
  let segments = [];
  for (let arg of args) {
    segments.push(SourceTextFactory.from(arg));
  }
  return segments;
}

describe('SourceTextBuilder', function() {

  const characters = createSourceTextList(
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
  );

  describe('#reduceSegments()', function() {
    it('should merge segments to minimum length', () => {
      // MinSegmentLength = 4
      let builder = new TestSourceTextBuilder(characters.slice(0, 6));
      let text = <CompositeText>builder.toSourceText();
      assertSourceText(text, 'abcdef');
      assert.equal(text.sources.length, 2);
      assert.equal(text.sources[0].length, 4);
      assert.equal(text.sources[1].length, 2);
    });
    it('should merge segments to maximum length', () => {
      const short = SourceTextFactory.from('AB');
      const long = SourceTextFactory.from('1234567');
      // MaxSegmentLength = 8
      let builder = new TestSourceTextBuilder([long, short, short, short, short]);
      let text = <CompositeText>builder.toSourceText();
      assertSourceText(text, '1234567ABABABAB');
      assert.equal(text.sources.length, 2);
      assert.equal(text.sources[0].length, 7);
      assert.equal(text.sources[1].length, 8);
    });
    it('should recalculate source length if text was deleted', () => {
      const source = SourceTextFactory.from('12345');
      const segment = source.slice(new TextSpan(0, 3));
      let builder = new TestSourceTextBuilder([...characters.slice(0, 5), segment]);
      let text = <CompositeText>builder.toSourceText();
      assertSourceText(text, 'abcde123');
      assert.equal(text.sourceLength, 8);  // Previous length was 10.
    });
    it('should exceed segment target if text is too long', () => {
      const long = SourceTextFactory.from('1234567');
      let builder = new TestSourceTextBuilder([long, long, ...characters.slice(0, 3)]);
      let text = <CompositeText>builder.toSourceText();
      assertSourceText(text, '12345671234567abc');
      assert.equal(text.sources.length, 3);
      assert.equal(text.sources[0].length, 7);
      assert.equal(text.sources[1].length, 8);
      assert.equal(text.sources[2].length, 2);
    });
  });

  describe('#toSourceText()', function() {
    it('should not reduce segments if count is less than or equal to limit', () => {
      // SegmentLimit = 4
      let builder = new TestSourceTextBuilder(characters.slice(0, 4));
      let text = <CompositeText>builder.toSourceText();
      assertSourceText(text, 'abcd');
      assert.equal(text.sources.length, 4);
    });
    it('should reduce segments if count is greater than limit', () => {
      // SegmentLimit = 4
      let builder = new TestSourceTextBuilder(characters.slice(0, 5));
      let text = <CompositeText>builder.toSourceText();
      assertSourceText(text, 'abcde');
      assert.equal(text.sources.length, 2);
    });
    it('should remove deleted text', () => {
      const source = SourceTextFactory.from('1234567890');
      const segment = source.slice(new TextSpan(0, 3));
      let builder = new TestSourceTextBuilder([segment]);
      let text = <StringText>builder.toSourceText();
      assertSourceText(text, '123');
      assert.equal(text instanceof StringText, true);
      assert.equal(text.sourceLength, 3);
    });
  });

});
