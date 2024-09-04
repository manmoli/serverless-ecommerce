import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apiGateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

const JWT_SECRET = 'the-secret-super-secret'
export class ServerlessEcommerceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productImagesBucket = new s3.Bucket(this, 'ProductImagesBucket');

    const productTable = new dynamodb.Table(this, 'ProductsTable', {
      partitionKey: { name: 'productId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const userTable = new dynamodb.Table(this, 'UserTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Adding the GSI for querying by email
    userTable.addGlobalSecondaryIndex({
      indexName: 'EmailIndex',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
    });

    const authLambda = new lambda.Function(this, 'AuthLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('src/lambda/authorization/auth/function.zip'),
      handler: 'index.handler',
      environment: {
        JWT_SECRET: JWT_SECRET
      }
    })

    const createUserHandler = new lambda.Function(this, 'CreateUserHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('src/lambda/users/create/function.zip'),
      handler: 'index.handler',
      environment: {
        USER_TABLE_NAME: userTable.tableName,
      },
    });

    const loginHandler = new lambda.Function(this, 'LoginHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('src/lambda/authorization/login/function.zip'),
      handler: 'index.handler',
      environment: {
        USER_TABLE_NAME: userTable.tableName,
        JWT_SECRET: JWT_SECRET
      },
    });

    const getUsersHandler = new lambda.Function(this, 'GetUsersHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('src/lambda/users/get/function.zip'),
      handler: 'index.handler',
      environment: {
        USER_TABLE_NAME: userTable.tableName,
      },
    });

    // Grant permissions for loginHandler to query the EmailIndex
    userTable.grantReadData(loginHandler);
    loginHandler.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['dynamodb:Query'],
      resources: [`${userTable.tableArn}/index/EmailIndex`],
    }));

    const createProductHandler = new lambda.Function(this, 'CreateProductHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('src/lambda/products/create/function.zip'),
      handler: 'index.handler',
      environment: {
        PRODUCT_TABLE_NAME: productTable.tableName,
        PRODUCT_BUCKET_NAME: productImagesBucket.bucketName,
      },
    });

    const getProductHandler = new lambda.Function(this, 'GetProductHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('src/lambda/products/get/function.zip'),
      handler: 'index.handler',
      environment: {
        PRODUCT_TABLE_NAME: productTable.tableName,
      },
    });

    const updateProductHandler = new lambda.Function(this, 'UpdateProductHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('src/lambda/products/update/function.zip'),
      handler: 'index.handler',
      environment: {
        PRODUCT_TABLE_NAME: productTable.tableName,
        PRODUCT_BUCKET_NAME: productImagesBucket.bucketName,
      },
    });

    const deleteProductHandler = new lambda.Function(this, 'DeleteProductHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('src/lambda/products/delete/function.zip'),
      handler: 'index.handler',
      environment: {
        PRODUCT_TABLE_NAME: productTable.tableName,
        PRODUCT_BUCKET_NAME: productImagesBucket.bucketName,
      },
    });

    userTable.grantReadWriteData(createUserHandler);
    userTable.grantReadData(getUsersHandler);

    productTable.grantReadWriteData(createProductHandler);
    productTable.grantReadWriteData(deleteProductHandler);
    productImagesBucket.grantDelete(deleteProductHandler);
    productImagesBucket.grantReadWrite(createProductHandler);
    productTable.grantReadData(getProductHandler);
    productTable.grantReadWriteData(updateProductHandler);
    productImagesBucket.grantReadWrite(updateProductHandler);

    const authorizer = new apiGateway.TokenAuthorizer(this, 'UserAuthorizer', {
      handler: authLambda
    })

    const userApi = new apiGateway.RestApi(this, 'UserApi');
    const userResource = userApi.root.addResource('user');
    userResource.addMethod('POST', new apiGateway.LambdaIntegration(createUserHandler));
    userResource.addMethod('GET', new apiGateway.LambdaIntegration(getUsersHandler));

    const authApi = new apiGateway.RestApi(this, 'AuthApi');
    const authResource = authApi.root.addResource('login');
    authResource.addMethod('POST', new apiGateway.LambdaIntegration(loginHandler));

    const productApi = new apiGateway.RestApi(this, 'ProductApi');
    const productResource = productApi.root.addResource('product');
    const productIdResource = productResource.addResource('{productId}');
    productResource.addMethod('POST', new apiGateway.LambdaIntegration(createProductHandler), {
      authorizer,
      authorizationType: apiGateway.AuthorizationType.CUSTOM
    });
    productResource.addMethod('GET', new apiGateway.LambdaIntegration(getProductHandler), {
      authorizer,
      authorizationType: apiGateway.AuthorizationType.CUSTOM
    });
    productIdResource.addMethod('PUT', new apiGateway.LambdaIntegration(updateProductHandler), {
      authorizer,
      authorizationType: apiGateway.AuthorizationType.CUSTOM
    });
    productIdResource.addMethod('DELETE', new apiGateway.LambdaIntegration(deleteProductHandler), {
      authorizer,
      authorizationType: apiGateway.AuthorizationType.CUSTOM
    });
  }
}
