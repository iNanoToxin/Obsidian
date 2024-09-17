import {getPrecedence, LatexOperatorLookup, Token, TokenType} from "./token";
import {AstNode, BinaryOperation, Identifer, UnaryOperation} from "./ast_node";

export class Parser
{
    tokens: Token[] = [];
    current: number = 0;
    variables: {[key: string]: Identifer} = {};

    parse(source: string): AstNode
    {
        this.tokens = [];
        this.current = 0;
        this.variables = {};

        if (!this.tokenize(source))
        {
            return null;
        }
        return this.parseExpression();
    }

    peek(): Token
    {
        return this.tokens[this.current];
    }

    next(): boolean
    {
        return this.current < this.tokens.length;
    }

    advance(): void
    {
        this.current++;
    }

    tokenize(input: string): boolean
    {
        let pos = 0;

        while (pos < input.length)
        {
            switch (input[pos])
            {
                case "\\":
                {
                    for (const [operator, type] of Object.entries(LatexOperatorLookup))
                    {
                        if (input.startsWith(operator, pos))
                        {
                            this.tokens.push(new Token(type, operator));
                            pos += operator.length;
                            break;
                        }
                    }
                    break;
                }

                case "(":
                {
                    this.tokens.push(new Token(TokenType.G_LPAR, "("));
                    pos++;
                    break;
                }
                case ")":
                {
                    this.tokens.push(new Token(TokenType.G_RPAR, ")"));
                    pos++;
                    break;
                }
                case " ":
                {
                    pos++;
                    break;
                }

                default:
                {
                    let regex = new RegExp("[a-zA-Z]+", "y");
                    regex.lastIndex = pos;

                    const match = regex.exec(input);
                    if (match)
                    {
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

    parseExpression(): AstNode
    {
        return this.parseExprRhs(this.parsePrimary(), 0);
    }

    parsePrimary(): AstNode
    {
        let lookahead: Token = this.peek();
        if (!lookahead)
        {
            return null;
        }

        switch (lookahead.type)
        {
            case TokenType.T_VAR:
            {
                this.advance();

                if (!this.variables[lookahead.literal])
                {
                    this.variables[lookahead.literal] = new Identifer(lookahead.literal);
                }
                return this.variables[lookahead.literal];
            }
            case TokenType.G_LPAR:
            {
                this.advance();
                let expr: AstNode = this.parseExpression();

                if (this.peek().type != TokenType.G_RPAR)
                {
                    return null;
                }
                this.advance();
                return expr;
            }
            case TokenType.L_NEG:
            {
                this.advance();

                let operand: AstNode = this.parseExprRhs(this.parsePrimary(), lookahead.getPrecedence());
                if (operand == null)
                {
                    return null;
                }
                return new UnaryOperation(lookahead.type, operand);
            }
            default:
            {
                return null;
            }
        }
    }

    parseExprRhs(lhs: AstNode, minPrecedence: number): AstNode
    {
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

        while (this.next() && lookahead.isBinaryOp() && lookahead.getPrecedence() >= minPrecedence)
        {
            let op: TokenType = lookahead.type;

            this.advance();
            let rhs: AstNode = this.parsePrimary();
            if (rhs == null)
            {
                return null;
            }
            lookahead = this.peek();

            while (this.next() && lookahead.isBinaryOp() && (lookahead.getPrecedence() > getPrecedence(op) || lookahead.isRightAssociative() && lookahead.getPrecedence() == getPrecedence(op)))
            {
                rhs = this.parseExprRhs(rhs, lookahead.getPrecedence());
                this.advance();
                lookahead = this.peek();
            }
            lhs = new BinaryOperation(op, lhs, rhs);
        }
        return lhs;
    }
}