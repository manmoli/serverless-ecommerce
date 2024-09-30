#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DataBaseServerlessEcommerceStack } from '../lib/database-stack';
import { LambdaServerlessEcommerceStack } from '../lib/lambda-stack';
import { ApiGatewayServerlessEcommerceStack } from '../lib/api_gateway-stack';

const app = new cdk.App();
new DataBaseServerlessEcommerceStack(app, 'DataBaseServerlessEcommerceStack', {
  env: { region: 'us-west-1'}
});

new LambdaServerlessEcommerceStack(app, 'LambdaServerlessEcommerceStack', {
  env: {region: 'us-west-1'}
})

new ApiGatewayServerlessEcommerceStack(app, 'ApiGatewayServerlessEcommerceStack', {
  env: { region: 'us-west-1'}
})