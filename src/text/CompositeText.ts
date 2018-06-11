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

import { ArgumentOutOfRangeException, List } from '@mattacosta/php-common';

import { ISourceText, SourceTextBase } from './SourceText';
import { SourceTextBuilder } from './SourceTextBuilder';
import { SourceTextFactory } from './SourceTextFactory';
import { TextSpan } from './TextSpan';

/**
 * @internal
 */
export class CompositePosition {

  constructor(public readonly index: number, public readonly offset: number) {}

}

/**
 * A source code container created from other source texts.
 *
 * @internal
 */
export class CompositeText extends SourceTextBase {

  /**
   * @inheritDoc
   */
  public readonly length: number;

  /**
   * @inheritDoc
   */
  public readonly sourceKey: ISourceText;

  /**
   * @inheritDoc
   */
  public readonly sourceLength: number;

  /**
   * @inheritDoc
   */
  public sources: ReadonlyArray<ISourceText>;

  /**
   * A list containing the offset of each segment.
   */
  protected segmentOffsets: ReadonlyArray<number>;

  /**
   * Constructs a `CompositeText` object.
   *
   * @param {ReadonlyArray<ISourceText>} sources
   *   A list of text segments.
   * @param {number} sourceLength
   *   The total length of the stored text. This may be greater than the length
   *   of the text.
   */
  protected constructor(sources: ReadonlyArray<ISourceText>, sourceLength: number) {
    super();

    let length = 0;
    let segmentOffsets = new Array(sources.length);
    for (let i = 0; i < sources.length; i++) {
      segmentOffsets[i] = length;
      length += sources[i].length;
    }

    this.length = length;
    this.sourceKey = this;
    this.sourceLength = sourceLength;
    this.sources = sources;
    this.segmentOffsets = segmentOffsets;
  }

  /**
   * @todo Document CompositeText.from().
   */
  public static from(sources: ReadonlyArray<ISourceText>, sourceLength: number): ISourceText {
    if (sources.length == 0) {
      return SourceTextFactory.EmptyText;
    }
    if (sources.length == 1) {
      return sources[0];
    }
    return new CompositeText(sources, sourceLength);
  }

  /**
   * @inheritDoc
   */
  public charCodeAt(offset: number): number {
    if (offset < 0 || offset >= this.length) {
      return NaN;
    }
    let position = this.positionAt(offset);
    return this.sources[position.index].charCodeAt(position.offset);
  }

  /**
   * @inheritDoc
   */
  public slice(spanOrPosition: TextSpan | number): ISourceText {
    if (typeof spanOrPosition === 'number') {
      spanOrPosition = TextSpan.fromBounds(spanOrPosition, this.length);
    }
    if (!this.isSpanInText(spanOrPosition)) {
      throw new ArgumentOutOfRangeException();
    }

    let position = this.positionAt(spanOrPosition.start);
    let builder = new SourceTextBuilder();

    let index = position.index;
    let offset = position.offset;
    let remainder = spanOrPosition.length;

    while (remainder > 0) {
      let length = Math.min(remainder, this.sources[index].length - offset);
      builder.append(this.sources[index].slice(new TextSpan(offset, length)));

      index++;
      offset = 0;
      remainder -= length;
    }

    return builder.toSourceText();
  }

  /**
   * @inheritDoc
   */
  public substring(start: number, length?: number): string {
    if (start < 0) {
      start = this.length + start;
    }
    if (start < 0 || start > this.length) {
      throw new ArgumentOutOfRangeException();
    }
    if (length === void 0) {
      length = this.length - start;
    }
    if (length < 0) {
      length = 0;
    }
    if (length > this.length - start) {
      throw new ArgumentOutOfRangeException();
    }

    let position = this.positionAt(start);
    let text = '';

    let index = position.index;
    let offset = position.offset;
    let remainder = length;

    while (remainder > 0) {
      let segmentLength = Math.min(remainder, this.sources[index].length - offset);
      text += this.sources[index].substring(offset, segmentLength);

      index++;
      offset = 0;
      remainder -= segmentLength;
    }

    return text;
  }

  /**
   * Determines which segment contains the specified offset.
   *
   * @param {number} offset
   *   The offset to search for.
   *
   * @return {CompositeTextPosition}
   *   The segment and offset within that segment, of the specified offset.
   */
  protected positionAt(offset: number): CompositePosition {
    let index = List.binarySearch(this.segmentOffsets, offset, CompositeText.offsetComparer);
    // If not found, the result is the two's complement of the index where it
    // should be, so the offset must be in the previous segment.
    index = index >= 0 ? index : (~index - 1);
    return new CompositePosition(index, offset - this.segmentOffsets[index]);
  }

  /**
   * Compares two offsets and returns the difference.
   */
  private static offsetComparer(a: number, b: number): number {
    // Since offsets are always positive integers, just subtract.
    return a - b;
  }

}
