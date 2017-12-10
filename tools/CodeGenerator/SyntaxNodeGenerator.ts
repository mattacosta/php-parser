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

export class SyntaxNodeGenerator {

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

  protected text: string;

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

  protected addAcceptMethods(visitorName: string, className: string): string {
    if (!visitorName) {
      console.log(className + 'SyntaxNode: Missing visitorName property.');
    }

    let text = '  public accept(visitor: SyntaxVisitor) {\n';
    if (!visitorName) {
      text += '    throw new Error(\'Not implemented\');\n';
    }
    else {
      text += '    visitor.' + visitorName + '(this);\n';
    }
    text += '  }\n';
    text += '\n';
    text += '  public acceptResult<T>(visitor: SyntaxTransform<T>): T {\n';
    if (!visitorName) {
      text += '    throw new Error(\'Not implemented\');\n';
    }
    else {
      text += '    return visitor.' + visitorName + '(this);\n';
    }
    text += '  }\n';
    return text;
  }

  protected addClass(info: NodeClass) {
    let abstract = info.abstract ? ' abstract' : '';
    let baseClass = info.extends ? info.extends + 'SyntaxNode' : 'SyntaxNode';

    this.text += 'export' + abstract + ' class ' + info.name + 'SyntaxNode extends ' + baseClass + ' {\n';
    this.text += '\n';
    if (info.properties) {
      let properties = this.addProperties(info.properties);
      if (properties.length > 0) {
        this.text += properties + '\n';
      }
      if (!info.abstract) {
        let getters = this.addGetters(info.properties, info.name);
        if (getters.length > 0) {
          this.text += getters + '\n';
        }
        this.text += this.addCountGetter(info.properties.length),
        this.text += '\n';
        this.text += this.addChildAtMethod(info.properties),
        this.text += '\n';
        this.text += this.addDefineChildAtMethod(info.properties),
        this.text += '\n';
        this.text += this.addAcceptMethods(info.visitorName, info.name),
        this.text += '\n';
      }
    }
    this.text += '}\n';
    this.text += '\n';
  }

  protected addCountGetter(count: number): string {
    let text = '';
    text += '  protected get count(): number {\n';
    text += '    return ' + count + ';\n';
    text += '  }\n';
    return text;
  }

  protected addChildAtMethod(properties: NodeProperty[]): string {
    let text = '';
    text += '  protected childAt(index: number): SyntaxNodeBase | null {\n';
    text += '    switch (index) {\n';
    for (let i = 0; i < properties.length; i++) {
      let prop = properties[i];
      if (prop.type != 'TokenNode') {
        text += '      case ' + i + ':\n';
        // NOTE: Since these properties are not initialized in the compiled JS,
        // a check is needed to avoid returning `undefined`.
        text += '        return this._' + prop.name + ' !== void 0 ? ' + 'this._' + prop.name + ' : null;\n';
      }
    }
    text += '      default:\n';
    text += '        return null;\n';
    text += '    }\n';
    text += '  }\n';
    return text;
  }

  protected addDefineChildAtMethod(properties: NodeProperty[]): string {
    let text = '';
    text += '  protected defineChildAt(index: number): SyntaxNodeBase | null {\n';
    text += '    switch (index) {\n';
    for (let i = 0; i < properties.length; i++) {
      let prop = properties[i];
      if (prop.type != 'TokenNode') {
        text += '      case ' + i + ':\n';
        text += '        if (this._' + prop.name + ' === void 0) {\n';
        if (!prop.optional) {
          let type = this.getSyntaxTypes(prop);
          text += i == 0
            ? '          let node: ' + type + ' | null = this.createFirstChildNode();\n'
            : '          let node: ' + type + ' | null = this.createChildNode(' + i + ');\n';
          text += '          if (!node) {\n';
          text += '            throw new InvalidOperationException(\'Unable to create child node\');\n';
          text += '          }\n';
          text += '          this._' + prop.name + ' = node;\n';
        }
        else {
          text += i == 0
            ? '          this._' + prop.name + ' = this.createFirstChildNode();\n'
            : '          this._' + prop.name + ' = this.createChildNode(' + i + ');\n';
        }
        text += '        }\n';
        text += '        return this._' + prop.name + ';\n';
      }
    }
    text += '      default:\n';
    text += '        return null;\n';
    text += '    }\n';
    text += '  }\n';
    return text;
  }

  protected addGetters(properties: NodeProperty[], className: string): string {
    let text = '';
    for (let i = 0; i < properties.length; i++) {
      let prop = properties[i];
      if (prop.type != 'TokenNode') {
        let type = this.getSyntaxTypes(prop);
        text += '  public get ' + prop.name + '(): ' + type + (prop.optional ? ' | null' : '') + ' {\n';
        text += '    if (this._' + prop.name + ' === void 0) {\n';
        if (!prop.optional) {
          text += i == 0
            ? '      let node: ' + type + ' | null = this.createFirstChildNode();\n'
            : '      let node: ' + type + ' | null = this.createChildNode(' + i + ');\n';
          text += '      if (!node) {\n';
          text += '        throw new InvalidOperationException(\'Unable to create child node\');\n';
          text += '      }\n';
          text += '      this._' + prop.name + ' = node;\n'
        }
        else {
          text += i == 0
            ? '      this._' + prop.name + ' = this.createFirstChildNode();\n'
            : '      this._' + prop.name + ' = this.createChildNode(' + i + ');\n';
        }
        text += '    }\n';
        text += '    return this._' + prop.name + ';\n';
        text += '  }\n';
      }
      else {
        let type = 'SyntaxToken' + (prop.optional ? ' | null' : '');
        text += '  public get ' + prop.name + '(): ' + type + ' {\n';
        if (prop.optional) {
          text += '    let token = (<' + className + 'Node>this.node).' + prop.name + ';\n';
          text += '    if (token !== null) {\n';
          text += '      return new SyntaxToken(token, this, this.offsetAt(' + i + '), this.relativeIndexAt(' + i + '));\n';
          text += '    }\n';
          text += '    return null;\n';
        }
        else {
          text += '    return new SyntaxToken((<' + className + 'Node>this.node).' + prop.name + ', this, this.offsetAt(' + i + '), this.relativeIndexAt(' + i + '));\n';
        }
        text += '  }\n';
      }
    }
    return text;
  }

  protected addImports(classList: NodeClass[]) {
    this.text += 'import { InvalidOperationException } from \'@mattacosta/php-common\';\n';
    this.text += 'import {\n';
    for (let i = 0; i < classList.length; i++) {
      if (classList[i].properties) {
        this.text += '  ' + classList[i].name + 'Node,\n';
      }
    }
    this.text += '} from \'../node/Node.Generated\';\n';
    this.text += 'import { SyntaxList } from \'./SyntaxList\';\n';
    this.text += 'import { SyntaxNode } from \'./SyntaxNode\';\n';
    this.text += 'import { SyntaxNodeBase } from \'./SyntaxNodeBase\';\n';
    this.text += 'import { SyntaxToken } from \'./SyntaxToken\';\n'
    this.text += 'import { SyntaxTransform } from \'./SyntaxTransform.Generated\';\n'
    this.text += 'import { SyntaxVisitor } from \'./SyntaxVisitor.Generated\';\n'
    this.text += '\n';
  }

  protected addProperties(properties: NodeProperty[]): string {
    let text = '';
    for (let i = 0; i < properties.length; i++) {
      let prop = properties[i];
      if (prop.inherited || prop.type === 'TokenNode') {
        continue;
      }
      let type = this.getSyntaxTypes(prop);
      text += '  protected _' + prop.name + ': ' + type + (prop.optional ? ' | null' : '') + ';\n';
    }
    return text;
  }

  protected getSyntaxTypes(property: NodeProperty): string {
    if (Array.isArray(property.type)) {
      let type = this.toSyntaxType(property.type[0]);
      for (let i = 1; i < property.type.length; i++) {
        type += ' | ' + this.toSyntaxType(property.type[i]);
      }
      return type;
    }
    return this.toSyntaxType(property.type);
  }

  protected toSyntaxType(type: string): string {
    switch (type) {
      case 'Node':
        return 'SyntaxNode';
      case 'NodeList':
        return 'SyntaxList';
      case 'TokenNode':
        return 'SyntaxToken';
      default:
        return type + 'SyntaxNode';
    }
  }

  public static generate(list: NodeClass[]): string {
    let nameSort = list.slice().sort((a, b) => {
      if (a.name > b.name) {
        return 1;
      }
      if (a.name < b.name) {
        return -1;
      }
      return 0;
    });
    // @todo This should really check dependencies, but it works. For now.
    let abstractSort = list.slice().sort((a, b) => {
      if (a.extends && !b.extends) {
        return 1;
      }
      if (!a.extends && b.extends) {
        return -1;
      }
      if (a.abstract && !b.abstract) {
        return -1;
      }
      if (!a.abstract && b.abstract) {
        return 1;
      }
      if (a.name > b.name) {
        return 1;
      }
      if (a.name < b.name) {
        return -1;
      }
      return 0;
    });

    let generator = new SyntaxNodeGenerator();
    generator.addImports(nameSort);
    for (let i = 0; i < abstractSort.length; i++) {
      generator.addClass(abstractSort[i]);
    }
    return generator.text;
  }

}
