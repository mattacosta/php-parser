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

import {
  ArgumentOutOfRangeException,
  IEquatable
} from '@mattacosta/php-common';

import { BomKind } from './BomKind';
import { TextChange } from './TextChange';
import { TextSpan } from './TextSpan';

/**
 * Defines an interface for objects containing source code.
 *
 * @todo Add a parseLines() method?
 */
export interface ISourceText extends IEquatable<ISourceText> {

  /**
   * The length of the text.
   */
  readonly length: number;

  /**
   * Returns an integer representing a character at a given location.
   *
   * @param {number} offset
   *   The offset of the character.
   *
   * @return {number}
   *   The integer value of the character.
   */
  charCodeAt(offset: number): number;

  /**
   * Creates a copy of the source text containing the given region.
   *
   * @param {TextSpan|number} spanOrPosition
   *   A span containing the region of text to copy, or the starting position
   *   of the region. If a position is given, all remaining text is included.
   *
   * @return {ISourceText}
   *   A section of the source text.
   */
  slice(spanOrPosition: TextSpan | number): ISourceText;

  /**
   * Extracts a section of the text as a string.
   *
   * @param {number} start
   *   The offset of the first character to extract. If this is a negative
   *   number, the offset will start from the end of the source text.
   * @param {number|undefined} length
   *   The number of characters to extract. If not provided, the length will be
   *   the number of characters from `start` to the end of the string. If the
   *   length is negative, it will be set to 0.
   *
   * @return {string}
   *   A section of the source text, as a string.
   */
  substring(start: number, length?: number): string;

}

/**
 * Provides a base class for objects that contain source code.
 */
export abstract class SourceTextBase implements ISourceText {

  /**
   * @inheritDoc
   */
  public abstract readonly length: number;

  /**
   * @inheritDoc
   */
  public abstract charCodeAt(offset: number): number;

  /**
   * @inheritDoc
   */
  public abstract slice(spanOrPosition: TextSpan | number): ISourceText;

  /**
   * @inheritDoc
   */
  public abstract substring(start: number, length?: number): string;

  /**
   * @inheritDoc
   */
  public equals(value: ISourceText): boolean {
    if (value === this) {
      return true;
    }
    if (this.length != value.length) {
      return false;
    }
    for (let i = 0; i < this.length; i++) {
      if (this.charCodeAt(i) != value.charCodeAt(i)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Attempts to determine if a byte order mark is present in the source text.
   *
   * @todo Experimental.
   * @todo Unused.
   */
  protected static tryReadByteOrderMark(bytes: Uint8Array, length: number): BomKind {
    if (length > bytes.length) {
      throw new ArgumentOutOfRangeException();
    }

    if (length >= 2) {
      if (bytes[0] == 0xFE && bytes[1] == 0xFF) {
        return BomKind.UTF16BE;
      }
      if (bytes[0] == 0xFF && bytes[1] == 0xFE) {
        return BomKind.UTF16LE;
      }
      if (bytes[0] == 0xEF) {
        if (length >= 3 && bytes[1] == 0xBB && bytes[2] == 0xBF) {
          return BomKind.UTF8;
        }
      }
    }

    return BomKind.Unknown;
  }

  /**
   * Determines if the given span is within the source text.
   *
   * @param {TextSpan} span
   *   The span being checked.
   */
  protected isSpanInText(span: TextSpan): boolean {
    if (span.start < 0 || span.start > this.length || span.end > this.length) {
      return false;
    }
    return true;
  }

}
