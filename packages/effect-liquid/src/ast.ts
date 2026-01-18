/**
 * Base interface for all AST nodes.
 * All nodes have a discriminated union type field for type-safe pattern matching.
 */
export interface AstNode {
  readonly type: string;
  readonly position?: number;
  readonly line?: number;
  readonly column?: number;
}

/**
 * Plain text content node.
 */
export interface TextNode extends AstNode {
  readonly type: "text";
  readonly value: string;
}

/**
 * Variable output node: {{ variable }}
 */
export interface VariableNode extends AstNode {
  readonly type: "variable";
  readonly name: string;
  readonly filters?: readonly FilterNode[];
}

/**
 * Filter application node: {{ var | filter: arg }}
 */
export interface FilterNode {
  readonly name: string;
  readonly args: readonly unknown[];
}

/**
 * Tag node: {% tag %}...{% endtag %}
 */
export interface TagNode extends AstNode {
  readonly type: "tag";
  readonly name: string;
  readonly args: readonly unknown[];
  readonly body: readonly AstNode[];
  readonly trimLeft?: boolean;
  readonly trimRight?: boolean;
}

/**
 * If/elsif/else control flow node.
 */
export interface IfNode extends AstNode {
  readonly type: "if";
  readonly condition: unknown;
  readonly body: readonly AstNode[];
  readonly elsif?: readonly IfNode[];
  readonly elseBody?: readonly AstNode[];
}

/**
 * Unless control flow node.
 */
export interface UnlessNode extends AstNode {
  readonly type: "unless";
  readonly condition: unknown;
  readonly body: readonly AstNode[];
}

/**
 * For loop node: {% for item in items %}
 */
export interface ForNode extends AstNode {
  readonly type: "for";
  readonly variable: string;
  readonly collection: string;
  readonly body: readonly AstNode[];
  readonly limit?: number;
  readonly offset?: number;
  readonly reversed?: boolean;
}

/**
 * Case/when control flow node.
 */
export interface CaseNode extends AstNode {
  readonly type: "case";
  readonly expression: unknown;
  readonly when: readonly WhenNode[];
  readonly elseBody?: readonly AstNode[];
}

/**
 * When clause in a case statement.
 */
export interface WhenNode {
  readonly values: readonly unknown[];
  readonly body: readonly AstNode[];
}

/**
 * Assign tag node: {% assign var = value %}
 */
export interface AssignNode extends AstNode {
  readonly type: "assign";
  readonly variable: string;
  readonly value: unknown;
}

/**
 * Capture tag node: {% capture var %}...{% endcapture %}
 */
export interface CaptureNode extends AstNode {
  readonly type: "capture";
  readonly variable: string;
  readonly body: readonly AstNode[];
}

/**
 * Comment node: {% comment %}...{% endcomment %}
 */
export interface CommentNode extends AstNode {
  readonly type: "comment";
  readonly content: string;
}

/**
 * Include tag node: {% include 'template' %}
 */
export interface IncludeNode extends AstNode {
  readonly type: "include";
  readonly template: string;
  readonly with?: Record<string, unknown>;
  readonly for?: string;
}

/**
 * Render tag node: {% render 'template' %}
 */
export interface RenderNode extends AstNode {
  readonly type: "render";
  readonly template: string;
  readonly with?: Record<string, unknown>;
}

/**
 * Union type of all AST nodes.
 */
export type LiquidAstNode =
  | TextNode
  | VariableNode
  | TagNode
  | IfNode
  | UnlessNode
  | ForNode
  | CaseNode
  | AssignNode
  | CaptureNode
  | CommentNode
  | IncludeNode
  | RenderNode;
