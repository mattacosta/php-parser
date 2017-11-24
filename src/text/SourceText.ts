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

import { BomKind } from './BomKind';
import { TextChange } from './TextChange';
import { TextSpan } from './TextSpan';

/**
 * Defines an interface for objects containing source code.
 *
 * @todo Add a parseLines() method?
 */
export interface ISourceText {

  /**
   * The length of the text.
   */
  readonly length: number;

  /**
   * Returns an integer representing a character at a given location.
   */
  charCodeAt(offset: number): number;

  /**
   * Extracts a section of the text as a new source code container.
   */
  slice(spanOrPosition: TextSpan | number): ISourceText;

  /**
   * Extracts a section of the text as a string.
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

}
