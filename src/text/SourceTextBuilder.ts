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

import { ArgumentOutOfRangeException } from '@mattacosta/php-common';

import { ISourceText } from './ISourceText';
import { SourceTextExtensions } from './SourceTextExtensions';
import { SourceTextFactory } from './SourceTextFactory';

/**
 * @todo Document `SourceTextBuilder`.
 */
export class SourceTextBuilder {

  /**
   * The minimum length of a rebuilt segment. Defaults to 1024.
   *
   * @todo Experimental.
   */
  protected static MinSegmentLength = 1024;  // 1KB

  /**
   * The maximum length of a rebuilt segment. Defaults to 1 << 24.
   *
   * @todo Experimental.
   */
  protected static MaxSegmentLength = 1 << 24;  // 16MB, 1<<27 = 128MB

  /**
   * The maximum number of segments before the text is considered to be too
   * fragmented. Defaults to 64.
   *
   * @todo Experimental.
   */
  protected static SegmentLimit = 64;

  /**
   * The number of segments for an optimized rebuild. Defaults to 16.
   *
   * @todo Experimental.
   */
  protected static SegmentRebuildLimit = 16;

  /**
   * The current length of the source text.
   */
  protected length = 0;

  /**
   * The text segments used to create the source text.
   */
  protected segments: ISourceText[];

  /**
   * The number of unique sources used to create the source text.
   */
  protected sourceCount = 0;

  /**
   * The total length of the unique sources used to create the source text.
   */
  protected sourceLength = 0;

  /**
   * A `Set` containing the unique sources used to create the source text.
   */
  protected uniqueSources: Set<ISourceText>;

  /**
   * Constructs a `SourceTextBuilder` object.
   *
   * @param {ReadonlyArray<ISourceText>} segments
   *   A list of text segments to append.
   */
  public constructor(segments?: ReadonlyArray<ISourceText>) {
    this.segments = [];
    this.uniqueSources = new Set();
    if (segments !== void 0) {
      this.appendRange(segments);
    }
  }

  /**
   * Merges the specified number of segments into the starting segment.
   *
   * @param {number} start
   *   The first segment to merge.
   * @param {number} length
   *   The number of segments to merge.
   */
  protected static merge(segments: ISourceText[], start: number, length: number): void {
    if (start < 0 || start + length > segments.length) {
      throw new ArgumentOutOfRangeException();
    }

    let text = '';
    for (let i = start; i < start + length; i++) {
      text += segments[i].substring(0);
    }
    segments.splice(start, length, SourceTextFactory.from(text));
  }

  /**
   * Appends a text segment to the source text.
   *
   * @param {ISourceText} segment
   *   The text segment to append.
   */
  public append(segment: ISourceText): void {
    if (SourceTextExtensions.isSourceTextContainer(segment)) {
      for (let i = 0; i < segment.sources.length; i++) {
        this.length += segment.sources[i].length;
        this.segments.push(segment.sources[i]);
        this.addSource(segment.sources[i]);
      }
    }
    else {
      this.length += segment.length;
      this.segments.push(segment);
      this.addSource(segment);
    }
  }

  /**
   * Appends a series of text segments to the source text.
   *
   * @param {ReadonlyArray<ISourceText>} segments
   *   A list of text segments to append.
   */
  public appendRange(segments: ReadonlyArray<ISourceText>): void {
    for (let i = 0; i < segments.length; i++) {
      this.append(segments[i]);
    }
  }

  /**
   * Creates a source text object from the text segments given to the builder.
   *
   * @return {ISourceText}
   *   A new source text object.
   */
  public toSourceText(): ISourceText {
    if (this.length === 0) {
      return SourceTextFactory.EmptyText;
    }

    // On the one hand, it would be nice to reclaim memory sooner, but on the
    // other hand that would temporarily allocate more than 1.5x the memory.
    if (this.length < this.sourceLength / 2) {
      SourceTextBuilder.merge(this.segments, 0, this.segments.length);
      return this.segments[0];
    }
    if (this.segments.length > SourceTextBuilder.SegmentLimit) {
      this.rebuildSegments(this.calculateRebuildSegmentLength());
    }

    return SourceTextFactory.createContainer(this.segments, this.sourceLength);
  }

  /**
   * Stores the underlying source used by a segment, if it is unique to the text
   * being built. Extending classes may override this method to change the
   * optimization strategy of custom `ISourceText` implementations.
   */
  protected addSource(segment: ISourceText): void {
    if (SourceTextExtensions.isSourceTextContainer(segment)) {
      this.uniqueSources.add(segment.sourceKey);
      if (this.uniqueSources.size > this.sourceCount) {
        this.sourceLength += segment.sourceLength;
        this.sourceCount++;
      }
    }
    else {
      // By default, custom implementations are treated as plain text.
      this.uniqueSources.add(segment);
      if (this.uniqueSources.size > this.sourceCount) {
        this.sourceLength += segment.length;
        this.sourceCount++;
      }
    }
  }

  /**
   * Reduces the number of segments used by the new source text.
   *
   * @param {number} segmentLength
   *   The length of each new segment.
   *
   * @todo Experimental.
   */
  protected rebuildSegments(segmentLength: number): void {
    let segments = this.segments;
    this.reset();

    for (let i = 0; i < segments.length; i++) {
      // The current segment is already larger than the proposed length.
      if (segments[i].length > segmentLength) {
        this.append(segments[i]);
        continue;
      }

      let mergedLength = segments[i].length;
      let mergedSegments = 0;
      for (let n = i + 1; n < segments.length; n++) {
        if (mergedLength + segments[n].length <= segmentLength) {
          mergedLength += segments[n].length;
          mergedSegments++;
        }
        else {
          break;
        }
      }

      if (mergedSegments > 0) {
        SourceTextBuilder.merge(segments, i, mergedSegments + 1);
      }
      this.append(segments[i]);
    }
  }

  /**
   * Calculates the smallest segment length that also reduces the number of
   * builder segments below a threshold.
   */
  private calculateRebuildSegmentLength(): number {
    let length = SourceTextBuilder.MinSegmentLength;
    while (length <= SourceTextBuilder.MaxSegmentLength) {
      if (this.getRebuildSegmentCount(length) <= SourceTextBuilder.SegmentRebuildLimit) {
        return length;
      }
      length = length * 2;
    }
    return SourceTextBuilder.MaxSegmentLength;
  }

  /**
   * Determines how many segments will be in a rebuilt text that uses the
   * given segment length.
   */
  private getRebuildSegmentCount(segmentLength: number): number {
    let removedSegments = 0;
    for (let i = 0; i < this.segments.length; i++) {
      // The current segment is already larger than the proposed length.
      if (this.segments[i].length > segmentLength) {
        continue;
      }

      let mergedLength = this.segments[i].length;
      let mergedSegments = 0;
      for (let n = i + 1; n < this.segments.length; n++) {
        if (mergedLength + this.segments[n].length <= segmentLength) {
          mergedLength += this.segments[n].length;
          mergedSegments++;
        }
        else {
          break;
        }
      }

      if (mergedSegments > 0) {
        removedSegments += mergedSegments;
        i += mergedSegments;
      }
    }
    return this.segments.length - removedSegments;
  }

  /**
   * Resets the builder to its initial state.
   */
  private reset(): void {
    this.length = 0;
    this.segments = [];
    this.sourceCount = 0;
    this.sourceLength = 0;
    this.uniqueSources.clear();
  }

}
