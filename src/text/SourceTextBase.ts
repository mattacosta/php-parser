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
  ArgumentException,
  ArgumentOutOfRangeException
} from '@mattacosta/php-common';

import { BomKind } from './BomKind';
import { ISourceText } from './ISourceText';
import { ISourceTextContainer } from './ISourceTextContainer';
import { SourceTextBuilder } from './SourceTextBuilder';
import { SourceTextFactory } from './SourceTextFactory';
import { TextChange } from './TextChange';
import { TextSpan } from './TextSpan';

/**
 * Provides a base class for objects that contain source code.
 */
export abstract class SourceTextBase implements ISourceText, ISourceTextContainer {

  /**
   * @inheritDoc
   */
  public abstract readonly length: number;

  /**
   * @inheritDoc
   */
  public abstract readonly sourceKey: ISourceText;

  /**
   * @inheritDoc
   */
  public abstract readonly sourceLength: number;

  /**
   * @inheritDoc
   */
  public abstract readonly sources: ReadonlyArray<ISourceText>;

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
  public withChanges(changes: Iterable<TextChange>): ISourceText {
    let offset = 0;
    let hasInsertedText = false;
    let builder = new SourceTextBuilder();

    for (let change of changes) {
      if (change.span.start < offset) {
        throw new ArgumentException('Text changes must be sequential and cannot overlap');
      }

      // Skip "insert" and "delete" changes that do nothing.
      if (change.span.length == 0 && change.text.length == 0) {
        continue;
      }
      // Add text between the previous change and this change.
      if (change.span.start > offset) {
        builder.append(this.slice(new TextSpan(offset, change.span.start - offset)));
      }
      // If this is an "insert" or "replace" change, add its text.
      if (change.text.length > 0) {
        builder.append(SourceTextFactory.from(change.text));
        hasInsertedText = true;
      }

      offset = change.span.end;
    }

    // Nothing changed.
    if (offset == 0 && !hasInsertedText) {
      return this;
    }

    // Add the text between the last change and the end of the text.
    if (offset < this.length) {
      builder.append(this.slice(new TextSpan(offset, this.length - offset)));
    }

    return builder.toSourceText();
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
