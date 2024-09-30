import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs';
import * as apiGateway from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'

export class ApiGatewayServerlessEcommerceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        const authLambda = lambda.Function.fromFunctionName(this, 'ImportedAuthorizerLambda', cdk.Fn.importValue('authLambda'))
        const loginHandler = lambda.Function.fromFunctionName(this, 'ImportedLoginLambda', cdk.Fn.importValue('loginHandler'))

        const productAuthorizer = new apiGateway.TokenAuthorizer(this, 'ProductAuthorizer', { handler: authLambda })
        const ordersAuthorizer = new apiGateway.TokenAuthorizer(this, 'OrderAuthorizer', { handler: authLambda })

        const loginApi = new apiGateway.RestApi(this, 'LoginApi')
        const loginResource = loginApi.root.addResource('login')
        loginResource.addMethod('POST', new apiGateway.LambdaIntegration(loginHandler))

        const createUserHandler = lambda.Function.fromFunctionName(this, 'ImportedCreateUserLambda', cdk.Fn.importValue('createUserHandler'))
        const getUsersHandler = lambda.Function.fromFunctionName(this, 'ImportedGetUserLambda', cdk.Fn.importValue('getUserHandler'))
        const userApi = new apiGateway.RestApi(this, 'UserApi')
        const userResource = userApi.root.addResource('user')
        userResource.addMethod('POST', new apiGateway.LambdaIntegration(createUserHandler))
        userResource.addMethod('GET', new apiGateway.LambdaIntegration(getUsersHandler))

        const createProductHandler = lambda.Function.fromFunctionName(this, 'ImportedCreateProductLambda', cdk.Fn.importValue('createProductHandler'))
        const getProductHandler = lambda.Function.fromFunctionName(this, 'ImportedGetProductLambda', cdk.Fn.importValue('getProductHandler'))
        const updateProductHandler = lambda.Function.fromFunctionName(this, 'ImportedUpdateProductLambda', cdk.Fn.importValue('updateProductHandler'))
        const deleteProductHandler = lambda.Function.fromFunctionName(this, 'ImportedDeleteProductLambda', cdk.Fn.importValue('deleteProductHandler'))
        const productApi = new apiGateway.RestApi(this, 'ProductApi')
        const productResource = productApi.root.addResource('product')
        const productIdResource = productResource.addResource('{productId}')
        productResource.addMethod('POST', new apiGateway.LambdaIntegration(createProductHandler), {
            authorizer: productAuthorizer,
            authorizationType: apiGateway.AuthorizationType.CUSTOM
        })
        productIdResource.addMethod('GET', new apiGateway.LambdaIntegration(getProductHandler), {
            authorizer: productAuthorizer,
            authorizationType: apiGateway.AuthorizationType.CUSTOM
        })
        productIdResource.addMethod('PUT', new apiGateway.LambdaIntegration(updateProductHandler), {
            authorizer: productAuthorizer,
            authorizationType: apiGateway.AuthorizationType.CUSTOM
        })
        productIdResource.addMethod('DELETE', new apiGateway.LambdaIntegration(deleteProductHandler), {
            authorizer: productAuthorizer,
            authorizationType: apiGateway.AuthorizationType.CUSTOM
        })

        const createOrderHandler = lambda.Function.fromFunctionName(this, 'ImportedCreateOrdersLambda', cdk.Fn.importValue('createOrderHandler'))
        const ordersApi = new apiGateway.RestApi(this, 'OrdersApi')
        const orderResource = ordersApi.root.addResource('orders')
        orderResource.addMethod('POST', new apiGateway.LambdaIntegration(createOrderHandler), {
            authorizer: ordersAuthorizer,
            authorizationType: apiGateway.AuthorizationType.CUSTOM
        })
    }
}