import { Effect } from "effect";
import type { LiquidAstNode } from "./ast.js";
import { LiquidParseError } from "./errors.js";

/**
 * Token types for Liquid syntax.
 */
type TokenType =
  | "TEXT"
  | "OUTPUT_START"
  | "OUTPUT_END"
  | "TAG_START"
  | "TAG_END"
  | "IDENTIFIER"
  | "STRING"
  | "NUMBER"
  | "OPERATOR"
  | "DOT"
  | "PIPE"
  | "COLON"
  | "COMMA"
  | "EOF";

interface Token {
  readonly type: TokenType;
  readonly value: string;
  readonly position: number;
  readonly line: number;
  readonly column: number;
}

/**
 * Lexer for Liquid templates.
 */
class Lexer {
  private pos = 0;
  private line = 1;
  private column = 1;
  private readonly source: string;

  constructor(source: string) {
    this.source = source;
  }

  private peek(offset = 0): string {
    return this.source[this.pos + offset] ?? "";
  }

  private advance(): string {
    const char = this.peek();
    if (char === "\n") {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    this.pos++;
    return char;
  }

  private skipWhitespace(): void {
    while (this.pos < this.source.length && /\s/.test(this.peek())) {
      this.advance();
    }
  }

  private readString(quote: string): string {
    let value = "";
    this.advance(); // Skip opening quote

    while (this.pos < this.source.length) {
      const char = this.peek();
      if (char === quote && this.peek(-1) !== "\\") {
        this.advance(); // Skip closing quote
        break;
      }
      if (char === "\\" && this.peek(1) === quote) {
        this.advance(); // Skip backslash
        value += this.advance(); // Add quoted character
      } else {
        value += this.advance();
      }
    }

    return value;
  }

  private readNumber(): string {
    let value = "";
    while (this.pos < this.source.length && /[\d.]/.test(this.peek())) {
      value += this.advance();
    }
    return value;
  }

  private readIdentifier(): string {
    let value = "";
    while (
      this.pos < this.source.length &&
      /[a-zA-Z0-9_\-]/.test(this.peek())
    ) {
      value += this.advance();
    }
    return value;
  }

  tokenize(): Effect.Effect<readonly Token[], LiquidParseError> {
    return Effect.try({
      try: () => {
        const tokens: Token[] = [];
        let inOutput = false;
        let inTag = false;
        let textStart = 0;

        while (this.pos < this.source.length) {
          const current = this.peek();
          const next = this.peek(1);

          // Check for output start: {{
          if (current === "{" && next === "{" && !inOutput && !inTag) {
            // Emit any text before this
            if (this.pos > textStart) {
              tokens.push({
                type: "TEXT",
                value: this.source.slice(textStart, this.pos),
                position: textStart,
                line: this.line,
                column: this.column,
              });
            }

            const trimLeft = this.peek(2) === "-";
            const startPos = this.pos;
            const startLine = this.line;
            const startCol = this.column;

            this.advance(); // {
            this.advance(); // {
            if (trimLeft) {
              this.advance(); // -
            }

            tokens.push({
              type: "OUTPUT_START",
              value: trimLeft ? "{{-" : "{{",
              position: startPos,
              line: startLine,
              column: startCol,
            });

            inOutput = true;
            textStart = this.pos;
            continue;
          }

          // Check for output end: }}
          if (current === "}" && next === "}" && inOutput) {
            const trimRight = this.peek(-1) === "-";
            const startPos = this.pos;
            const startLine = this.line;
            const startCol = this.column;

            this.advance(); // }
            this.advance(); // }
            if (trimRight) {
              this.advance(); // -
            }

            tokens.push({
              type: "OUTPUT_END",
              value: trimRight ? "-}}" : "}}",
              position: startPos,
              line: startLine,
              column: startCol,
            });

            inOutput = false;
            textStart = this.pos;
            continue;
          }

          // Check for tag start: {%
          if (current === "{" && next === "%" && !inOutput && !inTag) {
            // Emit any text before this
            if (this.pos > textStart) {
              tokens.push({
                type: "TEXT",
                value: this.source.slice(textStart, this.pos),
                position: textStart,
                line: this.line,
                column: this.column,
              });
            }

            const trimLeft = this.peek(2) === "-";
            const startPos = this.pos;
            const startLine = this.line;
            const startCol = this.column;

            this.advance(); // {
            this.advance(); // %
            if (trimLeft) {
              this.advance(); // -
            }

            tokens.push({
              type: "TAG_START",
              value: trimLeft ? "{%-" : "{%",
              position: startPos,
              line: startLine,
              column: startCol,
            });

            inTag = true;
            this.skipWhitespace();
            continue;
          }

          // Check for tag end: %}
          if (current === "%" && next === "}" && inTag) {
            const trimRight = this.peek(-1) === "-";
            const startPos = this.pos;
            const startLine = this.line;
            const startCol = this.column;

            this.advance(); // %
            this.advance(); // }
            if (trimRight) {
              this.advance(); // -
            }

            tokens.push({
              type: "TAG_END",
              value: trimRight ? "-%}" : "%}",
              position: startPos,
              line: startLine,
              column: startCol,
            });

            inTag = false;
            textStart = this.pos;
            continue;
          }

          if (inOutput || inTag) {
            this.skipWhitespace();

            // String literals
            if (current === '"' || current === "'") {
              const startPos = this.pos;
              const startLine = this.line;
              const startCol = this.column;
              const value = this.readString(current);
              tokens.push({
                type: "STRING",
                value,
                position: startPos,
                line: startLine,
                column: startCol,
              });
              continue;
            }

            // Numbers
            if (/\d/.test(current)) {
              const startPos = this.pos;
              const startLine = this.line;
              const startCol = this.column;
              const value = this.readNumber();
              tokens.push({
                type: "NUMBER",
                value,
                position: startPos,
                line: startLine,
                column: startCol,
              });
              continue;
            }

            // Operators
            if (/[=!<>]/.test(current)) {
              const startPos = this.pos;
              const startLine = this.line;
              const startCol = this.column;
              let op = this.advance();
              if (
                (op === "=" || op === "!" || op === "<" || op === ">") &&
                this.peek() === "="
              ) {
                op += this.advance();
              }
              tokens.push({
                type: "OPERATOR",
                value: op,
                position: startPos,
                line: startLine,
                column: startCol,
              });
              continue;
            }

            // Special characters
            if (current === ".") {
              tokens.push({
                type: "DOT",
                value: ".",
                position: this.pos,
                line: this.line,
                column: this.column,
              });
              this.advance();
              continue;
            }

            if (current === "|") {
              tokens.push({
                type: "PIPE",
                value: "|",
                position: this.pos,
                line: this.line,
                column: this.column,
              });
              this.advance();
              continue;
            }

            if (current === ":") {
              tokens.push({
                type: "COLON",
                value: ":",
                position: this.pos,
                line: this.line,
                column: this.column,
              });
              this.advance();
              continue;
            }

            if (current === ",") {
              tokens.push({
                type: "COMMA",
                value: ",",
                position: this.pos,
                line: this.line,
                column: this.column,
              });
              this.advance();
              continue;
            }

            // Identifiers
            if (/[a-zA-Z_]/.test(current)) {
              const startPos = this.pos;
              const startLine = this.line;
              const startCol = this.column;
              const value = this.readIdentifier();
              tokens.push({
                type: "IDENTIFIER",
                value,
                position: startPos,
                line: startLine,
                column: startCol,
              });
              continue;
            }
          } else {
            this.advance();
          }
        }

        // Emit any remaining text
        if (this.pos > textStart) {
          tokens.push({
            type: "TEXT",
            value: this.source.slice(textStart),
            position: textStart,
            line: this.line,
            column: this.column,
          });
        }

        tokens.push({
          type: "EOF",
          value: "",
          position: this.pos,
          line: this.line,
          column: this.column,
        });

        return tokens;
      },
      catch: (error) =>
        new LiquidParseError({
          message: `Lexer error: ${
            error instanceof Error ? error.message : String(error)
          }`,
          position: this.pos,
          line: this.line,
          column: this.column,
          cause: error,
        }),
    });
  }
}

/**
 * Parser for Liquid templates.
 */
class Parser {
  private pos = 0;
  private readonly tokens: readonly Token[];
  private readonly source: string;

  constructor(tokens: readonly Token[], source: string) {
    this.tokens = tokens;
    this.source = source;
  }

  private peek(): Token {
    return (
      this.tokens[this.pos] ?? {
        type: "EOF",
        value: "",
        position: -1,
        line: 0,
        column: 0,
      }
    );
  }

  private advance(): Token {
    return (
      this.tokens[this.pos++] ?? {
        type: "EOF",
        value: "",
        position: -1,
        line: 0,
        column: 0,
      }
    );
  }

  private expect(type: TokenType): Token {
    const token = this.peek();
    if (token.type !== type) {
      throw new Error(
        `Expected ${type}, got ${token.type} at position ${token.position}`
      );
    }
    return this.advance();
  }

  private parseExpression(): unknown {
    const token = this.peek();

    if (token.type === "STRING") {
      return this.advance().value;
    }

    if (token.type === "NUMBER") {
      const num = Number.parseFloat(this.advance().value);
      return Number.isNaN(num) ? null : num;
    }

    if (token.type === "IDENTIFIER") {
      let path = this.advance().value;
      while (this.peek().type === "DOT") {
        this.advance(); // Skip dot
        path += "." + this.expect("IDENTIFIER").value;
      }
      return path;
    }

    return null;
  }

  private parseFilter(): { name: string; args: readonly unknown[] } {
    this.expect("PIPE");
    const name = this.expect("IDENTIFIER").value;
    const args: unknown[] = [];
    let filterArgAttempts = 0;

    while (this.peek().type === "COLON" && filterArgAttempts < 100) {
      filterArgAttempts++;
      const beforePos = this.pos;
      this.advance(); // Skip colon
      const expr = this.parseExpression();
      const afterPos = this.pos;

      // Only add if we got a valid expression and advanced position
      if (expr !== null && afterPos > beforePos) {
        args.push(expr);
      } else if (afterPos === beforePos) {
        // If we didn't advance, break to avoid infinite loop
        break;
      }
    }

    return { name, args };
  }

  private parseVariable(): LiquidAstNode {
    const startToken = this.expect("OUTPUT_START");
    const firstToken = this.peek();

    // Handle numeric literals or identifiers
    let path: string;
    if (firstToken.type === "NUMBER") {
      // For numeric literals, use the number as a string identifier
      path = this.advance().value;
    } else if (firstToken.type === "IDENTIFIER") {
      path = this.advance().value;
      while (this.peek().type === "DOT") {
        this.advance(); // Skip dot
        path += "." + this.expect("IDENTIFIER").value;
      }
    } else {
      // If it's not an identifier or number, try to parse as expression
      const expr = this.parseExpression();
      path = String(expr ?? "");
    }

    const filters: Array<{ name: string; args: readonly unknown[] }> = [];
    while (this.peek().type === "PIPE") {
      filters.push(this.parseFilter());
    }

    this.expect("OUTPUT_END");

    return {
      type: "variable",
      name: path,
      ...(filters.length > 0 && { filters }),
      position: startToken.position,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private parseTag(): LiquidAstNode {
    const startToken = this.expect("TAG_START");
    const tagName = this.expect("IDENTIFIER").value.toLowerCase();

    // Parse tag arguments
    const args: unknown[] = [];
    let argParseAttempts = 0;
    while (
      this.peek().type !== "TAG_END" &&
      this.peek().type !== "EOF" &&
      argParseAttempts < 100
    ) {
      argParseAttempts++;
      const beforePos = this.pos;
      const expr = this.parseExpression();
      const afterPos = this.pos;

      // Only add if we got a valid expression and advanced position
      if (expr !== null && afterPos > beforePos) {
        args.push(expr);
      }

      // Skip comma if present
      if (this.peek().type === "COMMA") {
        this.advance();
      } else if (
        this.peek().type !== "TAG_END" &&
        this.peek().type !== "EOF" &&
        afterPos === beforePos
      ) {
        // If we didn't advance, skip this token to avoid infinite loop
        this.advance();
      }
    }

    const trimRight = startToken.value.includes("-");
    this.expect("TAG_END");

    // Self-closing tags (no body, no end tag)
    // Note: assign is also self-closing but handled separately below
    if (
      tagName === "comment" ||
      tagName === "else" ||
      tagName === "elsif" ||
      tagName === "endif" ||
      tagName === "endcase" ||
      tagName === "when" ||
      tagName === "assign"
    ) {
      return {
        type: "tag",
        name: tagName,
        args,
        body: [],
        trimLeft: trimRight,
        trimRight: false,
        position: startToken.position,
        line: startToken.line,
        column: startToken.column,
      };
    }

    // Tags with body
    const body: LiquidAstNode[] = [];
    let endFound = false;
    const endTagNames = [`end${tagName}`, tagName];

    // Special handling for if tag - allow else/elsif/endif
    if (tagName === "if") {
      endTagNames.push("endif");
    }

    // Special handling for case tag - allow when/endcase
    if (tagName === "case") {
      endTagNames.push("endcase");
    }

    let bodyParseAttempts = 0;
    let lastPos = this.pos;
    while (
      !endFound &&
      this.peek().type !== "EOF" &&
      bodyParseAttempts < 1000
    ) {
      bodyParseAttempts++;

      // Safety check: if we haven't advanced, break to avoid infinite loop
      if (this.pos === lastPos && bodyParseAttempts > 1) {
        break;
      }
      lastPos = this.pos;

      const token = this.peek();

      if (token.type === "TAG_START") {
        const savedPos = this.pos;
        this.advance(); // TAG_START
        const nextToken = this.peek();

        if (nextToken.type === "IDENTIFIER") {
          const nextTagName = nextToken.value.toLowerCase();

          // Check for end tag
          if (endTagNames.includes(nextTagName)) {
            // Found end tag - consume it and exit
            this.advance(); // endtag name
            this.expect("TAG_END");
            endFound = true;
            break;
          }

          // For if tags, else/elsif/endif are part of the structure
          if (
            tagName === "if" &&
            (nextTagName === "else" ||
              nextTagName === "elsif" ||
              nextTagName === "endif")
          ) {
            if (nextTagName === "endif") {
              // Found endif - consume it and exit
              this.advance(); // endif
              this.expect("TAG_END");
              endFound = true;
              break;
            } else {
              // else or elsif - include in body as a tag node
              this.pos = savedPos;
              body.push(this.parseNode());
              continue;
            }
          }

          // For case tags, when/endcase are part of the structure
          if (
            tagName === "case" &&
            (nextTagName === "when" || nextTagName === "endcase")
          ) {
            if (nextTagName === "endcase") {
              // Found endcase - consume it and exit (don't add to body)
              this.advance(); // endcase
              this.expect("TAG_END");
              endFound = true;
              break;
            } else {
              // when - parse it as a tag with body, then include in body
              this.pos = savedPos;
              const whenNode = this.parseNode();
              // Parse when tag's body (content until next when/else/endcase)
              if (whenNode.type === "tag") {
                const whenTag = whenNode as import("./ast.js").TagNode;
                // Parse body for when tag
                const whenBody: LiquidAstNode[] = [];
                let whenEndFound = false;
                while (!whenEndFound && this.peek().type !== "EOF") {
                  if (this.peek().type === "TAG_START") {
                    const savedWhenPos = this.pos;
                    this.advance();
                    const whenNextToken = this.peek();
                    if (whenNextToken.type === "IDENTIFIER") {
                      const whenNextTagName = whenNextToken.value.toLowerCase();
                      if (
                        whenNextTagName === "when" ||
                        whenNextTagName === "else" ||
                        whenNextTagName === "endcase"
                      ) {
                        // End of when body
                        this.pos = savedWhenPos;
                        whenEndFound = true;
                        break;
                      }
                    }
                    this.pos = savedWhenPos;
                  }
                  whenBody.push(this.parseNode());
                }
                // Create when node with body
                body.push({
                  ...whenTag,
                  body: whenBody,
                });
              } else {
                body.push(whenNode);
              }
              continue;
            }
          }
        }

        // Not a special tag, restore position and parse normally
        this.pos = savedPos;
      }

      // Parse the next node
      const nodeBeforePos = this.pos;
      const node = this.parseNode();
      const nodeAfterPos = this.pos;

      // Safety check: ensure we advanced
      if (nodeAfterPos === nodeBeforePos && bodyParseAttempts > 1) {
        // We didn't advance, break to avoid infinite loop
        break;
      }

      body.push(node);
    }

    if (!endFound && bodyParseAttempts >= 1000) {
      throw new Error(
        `Infinite loop detected while parsing tag '${tagName}' body at position ${this.pos}`
      );
    }

    // Also check if we stopped due to position not advancing
    if (!endFound && this.pos === lastPos && bodyParseAttempts > 1) {
      throw new Error(
        `Parser stopped advancing while parsing tag '${tagName}' body at position ${this.pos}`
      );
    }

    return {
      type: "tag",
      name: tagName,
      args,
      body,
      trimLeft: trimRight,
      trimRight:
        this.peek().type === "TAG_END" && this.peek().value.includes("-"),
      position: startToken.position,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private parseNode(): LiquidAstNode {
    const token = this.peek();

    if (token.type === "TEXT") {
      const textToken = this.advance();
      return {
        type: "text",
        value: textToken.value,
        position: textToken.position,
        line: textToken.line,
        column: textToken.column,
      };
    }

    if (token.type === "OUTPUT_START") {
      return this.parseVariable();
    }

    if (token.type === "TAG_START") {
      return this.parseTag();
    }

    throw new Error(
      `Unexpected token: ${token.type} at position ${token.position}`
    );
  }

  parse(): Effect.Effect<readonly LiquidAstNode[], LiquidParseError> {
    return Effect.try({
      try: () => {
        const nodes: LiquidAstNode[] = [];

        while (this.peek().type !== "EOF") {
          nodes.push(this.parseNode());
        }

        return nodes;
      },
      catch: (error) => {
        const token = this.peek();
        return new LiquidParseError({
          message: `Parse error: ${
            error instanceof Error ? error.message : String(error)
          }`,
          position: token.position,
          line: token.line,
          column: token.column,
          cause: error,
        });
      },
    });
  }
}

/**
 * Parses a Liquid template string into an AST.
 */
export function parseTemplate(
  source: string
): Effect.Effect<readonly LiquidAstNode[], LiquidParseError> {
  return Effect.gen(function* () {
    const lexer = new Lexer(source);
    const tokens = yield* lexer.tokenize();
    const parser = new Parser(tokens, source);
    return yield* parser.parse();
  });
}
