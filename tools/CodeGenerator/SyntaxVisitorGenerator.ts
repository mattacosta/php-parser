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

import * as os from 'os';

import { NodeClass, NodeProperty } from './NodeConfig';

export class SyntaxVisitorGenerator {

  protected readonly licenseText: string = [
    '/**',
    ' * Copyright 2017 Matt Acosta',
    ' *',
    ' * Licensed under the Apache License, Version 2.0 (the "License");',
    ' * you may not use this file except in compliance with the License.',
    ' * You may obtain a copy of the License at',
    ' *',
    ' *     http://www.apache.org/licenses/LICENSE-2.0',
    ' *',
    ' * Unless required by applicable law or agreed to in writing, software',
    ' * distributed under the License is distributed on an "AS IS" BASIS,',
    ' * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.',
    ' * See the License for the specific language governing permissions and',
    ' * limitations under the License.',
    ' */'
  ].join(os.EOL);

  protected text = '';

  protected constructor() {
    this.text = this.licenseText +
      '\n' +
      '\n' +
      '// ----------------------------------------------------------------------------\n' +
      '// THIS IS A GENERATED FILE. DO NOT MODIFY.\n' +
      '// ----------------------------------------------------------------------------\n' +
      '\n' +
      '\'use strict\';\n' +
      '\n';
  }

  protected generateClass(list: NodeClass[]) {
    this.text += this.addImports(list);
    this.text += '\n';
    this.text += 'export abstract class SyntaxVisitor {\n';
    this.text += '\n';
    this.text += this.addVisitMethods();
    this.text += '\n';
    this.text += this.addMethods(list);
    this.text += '\n';
    this.text += '}\n';
  }

  protected addImports(list: NodeClass[]): string {
    let text = '';
    text += 'import {\n';
    for (let i = 0; i < list.length; i++) {
      text += '  ' + list[i].name + 'SyntaxNode,\n';
    }
    text += '} from \'./SyntaxNode.Generated\';\n';
    text += 'import { SourceTextSyntaxNode } from \'./SourceTextSyntaxNode\';\n';
    text += 'import { SyntaxNode } from \'./SyntaxNode\';\n';
    return text;
  }

  protected addMethods(list: NodeClass[]): string {
    let shared: { [ key: string ]: boolean } = {};  // = new Map<string, boolean>();

    let text = '';

    // Manually create the visitor method for root nodes.
    text += '  public visitSourceText(node: SourceTextSyntaxNode) {\n';
    text += '    this.defaultVisit(node);\n';
    text += '  }\n';
    text += '\n';

    for (let i = 0; i < list.length; i++) {
      if (list[i].abstract) {
        continue;
      }

      let name = list[i].name + 'SyntaxNode';
      let visitorName = list[i].visitorName;

      if (typeof visitorName === 'undefined') {
        console.log(name + ': Missing visitorName property.');
        continue;
      }

      if (list[i].visitorType) {
        name = list[i].visitorType + 'SyntaxNode';
        if (shared[visitorName]) {
          continue;
        }
        shared[visitorName] = true;
      }

      text += '  public ' + list[i].visitorName + '(node: ' + name + ') {\n';
      text += '    this.defaultVisit(node);\n';
      text += '  }\n';
    }
    return text;
  }

  protected addVisitMethods(): string {
    let text = '';
    text += '  public defaultVisit(node: SyntaxNode) {\n';
    text += '    // Does nothing.\n';
    text += '  }\n';
    text += '\n';
    text += '  public visit(node: SyntaxNode) {\n';
    text += '    node.accept(this);\n';
    text += '  }\n';
    // text += '\n';
    // text += '  public visitToken(token: SyntaxToken) {\n';
    // text += '    // this.defaultVisit(token);\n';
    // text += '  }\n';
    // text += '\n';
    // text += '  public visitTrivia(trivia: SyntaxTrivia) {\n';
    // text += '    // this.defaultVisit(trivia);\n';
    // text += '  }\n';
    return text;
  }

  public static generate(list: NodeClass[]): string {
    let generator = new SyntaxVisitorGenerator();
    let sortedList = list.slice().sort((a, b) => {
      if (a.name > b.name) {
        return 1;
      }
      if (a.name < b.name) {
        return -1;
      }
      return 0;
    });
    generator.generateClass(sortedList);
    return generator.text;
  }

}
