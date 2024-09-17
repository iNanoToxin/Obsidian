import {getPrecedence, Token, tokenize, TokenType} from "./token";
import {AstNode, BinaryOperation, Identifer, UnaryOperation} from "./ast_node";

export class Parser
{
    tokens: Token[] = [];
    current: number = 0;
    variables: {[key: string]: Identifer} = {};

    parse(source: string): AstNode
    {
        let tokens = tokenize(source);
        if (tokens == null)
        {
            return null;
        }

        this.tokens = tokens;
        this.current = 0;
        this.variables = {};
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