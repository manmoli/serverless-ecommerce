import { AuthResponse, APIGatewayTokenAuthorizerEvent, Context, PolicyDocument, Statement, StatementEffect, APIGatewayAuthorizerResultContext } from 'aws-lambda'
import * as jwt from 'jsonwebtoken'

const JWT_SECRET: string = process.env.JWT_SECRET ?? ''

export const handler = async (event: APIGatewayTokenAuthorizerEvent) => {
    try {
        const token = event.authorizationToken.split(' ')[1]
        const decoded: jwt.JwtPayload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload

        const policy = generatePolicy(decoded.userId, 'Allow', event.methodArn, decoded)

        return policy

    } catch (error: unknown) {
        console.log('Unauthorized: ', error)
        return generatePolicy('user', 'Deny', event.methodArn)
    }
}

const generatePolicy = function (principalId: string, effect: StatementEffect, resource: string, context?: APIGatewayAuthorizerResultContext) {
    const statement: Statement = {
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource
    }
    const policyDocument: PolicyDocument = {
        Version: '2012-10-17',
        Statement: [statement]
    };
    const authResponse: AuthResponse = {
        principalId: principalId,
        policyDocument: policyDocument,
        context: context
    }

    return authResponse;
}