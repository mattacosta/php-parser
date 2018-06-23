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

import { ErrorCode } from '../diagnostics/ErrorCode.Generated';
import { ISourceText } from '../text/SourceText';
import { SyntaxDiagnostic } from '../diagnostics/SyntaxDiagnostic';

/**
 * Defines an interface for objects that can generate tokens by scanning source
 * text.
 *
 * @template T, TState
 */
export interface ILexer<T, TState> {

  /**
   * Scans the source text until a token is found.
   *
   * @param {TState} state
   *   The scanning mode used by the lexer.
   *
   * @return {T}
   *   An object containing token information.
   */
  lex(state: TState): T;

  /**
   * Sets the current lexer position.
   *
   * @param {number} offset
   *   The offset into the text.
   */
  setPosition(offset: number): void;

  /**
   * Sets the source text to tokenize.
   */
  setText(text: ISourceText): void;

}

/**
 * Provides a base class for language tokenizers.
 */
export abstract class LexerBase<T, TState> implements ILexer<T, TState> {

  /**
   * A list of diagnostics found while attempting to scan for a token.
   */
  protected diagnostics: SyntaxDiagnostic[] = [];

  /**
   * @inheritDoc
   */
  public abstract lex(state: TState): T;

  /**
   * @inheritDoc
   */
  public abstract setPosition(offset: number): void;

  /**
   * @inheritDoc
   */
  public abstract setText(text: ISourceText): void;

  /**
   * Adds a new diagnostic to the list of diagnostics found during a scan.
   */
  protected addError(relativeOffset: number, width: number, code: ErrorCode, ...args: any[]) {
    this.diagnostics.push(this.createDiagnostic(relativeOffset, width, code, args));
  }

  /**
   * Creates a diagnostic for a token.
   */
  protected createDiagnostic(relativeOffset: number, width: number, code: ErrorCode, ...args: any[]): SyntaxDiagnostic {
    return new SyntaxDiagnostic(relativeOffset, width, code, args);
  }

}
