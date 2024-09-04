import { AuthResponse, APIGatewayTokenAuthorizerEvent, Context, APIGatewayEventLambdaAuthorizerContext, PolicyDocument, Statement, StatementEffect } from 'aws-lambda'
import * as jwt from 'jsonwebtoken'

const JWT_SECRET: string = process.env.JWT_SECRET ?? ''

export const handler = (event: APIGatewayTokenAuthorizerEvent): AuthResponse => {
    try {
        const token = event.authorizationToken.split(' ')[1]
        const decoded: jwt.JwtPayload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload
        console.log(decoded)

        const policy = generatePolicy(decoded.userId, 'Allow', event.methodArn)

        console.log(policy)

        return policy
    } catch (error: any) {
        console.error('Unauthorized: ', error)

        return {
            principalId: 'user',
            policyDocument: {
                Version: '2012-10-17',
                Statement: [{
                    Action: 'execute-api:Invoke',
                    Effect: 'Deny',
                    Resource: event.methodArn
                }]
            },
            context: {
                error: 'Unauthorized'
            }
        }
    }
}

const generatePolicy = function(principalId: string, effect: StatementEffect, resource: string) {
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
        policyDocument: policyDocument
        
    }
    
    authResponse.context = {
        "stringKey": "stringval",
        "numberKey": 123,
        "booleanKey": true
    };

    return authResponse;
}