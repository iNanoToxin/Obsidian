import { getPrecedence, LatexOperatorLookup, Token, TokenType } from "src/ast/token";
import { AstNode, BinaryOperation, Identifer, UnaryOperation } from "src/ast/ast_node";

export class Parser {
    tokens: Token[] = [];
    current = 0;
    variables: { [key: string]: Identifer } = {};

    parse(source: string): AstNode {
        this.tokens = [];
        this.current = 0;
        this.variables = {};

        if (!this.tokenize(source)) {
            return null;
        }
        return this.parseExpression();
    }

    peek(): Token {
        return this.tokens[this.current];
    }

    next(): boolean {
        return this.current < this.tokens.length;
    }

    advance(): void {
        this.current++;
    }

    tokenize(input: string): boolean {
        let pos = 0;

        mainLoop: while (pos < input.length) {
            switch (input[pos]) {
                case "\\": {
                    for (const [operator, type] of Object.entries(LatexOperatorLookup)) {
                        if (input.startsWith(operator, pos)) {
                            this.tokens.push(new Token(type, operator));
                            pos += operator.length;
                            continue mainLoop;
                        }
                    }
                    return false;
                }

                case "(": {
                    this.tokens.push(new Token(TokenType.G_LPAR, "("));
                    pos++;
                    break;
                }
                case ")": {
                    this.tokens.push(new Token(TokenType.G_RPAR, ")"));
                    pos++;
                    break;
                }
                case " ": {
                    pos++;
                    break;
                }

                default: {
                    const regex = new RegExp("[a-zA-Z]+", "y");
                    regex.lastIndex = pos;

                    const match = regex.exec(input);
                    if (match) {
                        this.tokens.push(new Token(TokenType.T_VAR, match[0]));
                        pos += match[0].length;
                        break;
                    }
                    return false;
                }
            }
        }
        return true;
    }

    parseExpression(): AstNode {
        return this.parseExprRhs(this.parsePrimary(), 0);
    }

    parsePrimary(): AstNode {
        const lookahead: Token = this.peek();
        if (!lookahead) {
            return null;
        }

        switch (lookahead.type) {
            case TokenType.T_VAR: {
                this.advance();

                return (this.variables[lookahead.literal] ??= new Identifer(lookahead.literal));
            }
            case TokenType.G_LPAR: {
                this.advance();
                const expr: AstNode = this.parseExpression();

                if (!expr || this.peek()?.type != TokenType.G_RPAR) {
                    return null;
                }
                this.advance();
                return expr;
            }
            case TokenType.L_NEG: {
                this.advance();

                const operand: AstNode = this.parseExprRhs(this.parsePrimary(), lookahead.getPrecedence());
                if (!operand) {
                    return null;
                }
                return new UnaryOperation(lookahead.type, operand);
            }
            default: {
                return null;
            }
        }
    }

    parseExprRhs(lhs: AstNode, minPrecedence: number): AstNode {
        // parse_expression_rhs(lhs, min_precedence = 0)
        //     lookahead := peek next token
        //     while lookahead is a binary operator with precedence >= min_precedence
        //         op := lookahead
        //         advance to next token
        //         rhs := parse_primary()
        //         lookahead := peek next token
        //         while lookahead is a binary operator whose precedence is greater than op's, or a right-associative operator whose precedence is equal to op's
        //             rhs := parse_expression_rhs(rhs, lookahead's precedence)
        //             lookahead := peek next token
        //         lhs := apply op to lhs and rhs
        //     return lhs

        let lookahead: Token = this.peek();

        while (this.next() && lookahead.isBinaryOp() && lookahead.getPrecedence() >= minPrecedence) {
            const op: TokenType = lookahead.type;

            this.advance();
            let rhs: AstNode = this.parsePrimary();
            if (rhs == null) {
                return null;
            }
            lookahead = this.peek();

            while (
                this.next() &&
                lookahead.isBinaryOp() &&
                (lookahead.getPrecedence() > getPrecedence(op) ||
                    (lookahead.isRightAssociative() && lookahead.getPrecedence() == getPrecedence(op)))
            ) {
                rhs = this.parseExprRhs(rhs, lookahead.getPrecedence());
                this.advance();
                lookahead = this.peek();
            }
            lhs = new BinaryOperation(op, lhs, rhs);
        }
        return lhs;
    }
}
