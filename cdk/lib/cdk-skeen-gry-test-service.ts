import ecs = require('aws-cdk-lib/aws-ecs');
import ecs_patterns = require('aws-cdk-lib/aws-ecs-patterns');
import ec2 = require('aws-cdk-lib/aws-ec2');
import cdk = require('aws-cdk-lib');
import dynamo = require('aws-cdk-lib/aws-dynamodb');
import apigw = require('aws-cdk-lib/aws-apigatewayv2');
import cloudfront = require('aws-cdk-lib/aws-cloudfront');
import origins = require('aws-cdk-lib/aws-cloudfront-origins');
import iam = require('aws-cdk-lib/aws-iam');
import logs = require('aws-cdk-lib/aws-logs');


const tableProps: dynamo.TableProps = {
    partitionKey:  { name: 'id', type: dynamo.AttributeType.STRING },
    billingMode: dynamo.BillingMode.PROVISIONED,
    writeCapacity: 1,
    readCapacity: 1,
    tableName: "urls"
}

const vpcProps: ec2.VpcProps = {
    cidr: '10.0.0.0/16',
    maxAzs: 2
}


export class SkeenGryTestService extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB table
    const table = new dynamo.Table(this, "urls-table", tableProps);

    const fargateTaskRole = new iam.Role(this, 'Role', {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        description: 'Access to DynamoDB Table',
      });
 
    table.grantReadData(fargateTaskRole)

    const logging = new ecs.AwsLogDriver({
        streamPrefix: "url_shortener",
      })
    
    // Create a cluster
    const vpc = new ec2.Vpc(this, 'Vpc', vpcProps);
    const cluster = new ecs.Cluster(this, 'url-shortener-fargate-service-autoscaling', { vpc });

    const fargateTaskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
        memoryLimitMiB: 1024,
        cpu: 512,
        taskRole: fargateTaskRole
      });
    const container = fargateTaskDefinition.addContainer("WebContainer", {
        // Use an image from DockerHub
        image: ecs.ContainerImage.fromRegistry("chiefus/url-shortener:0.0.1"),
        logging
      });
      container.addPortMappings({
          containerPort: 8080,
          hostPort: 8080,
          protocol: ecs.Protocol.TCP
      })


    const fargateServiceProps: ecs_patterns.ApplicationLoadBalancedFargateServiceProps = {
        cluster,
        memoryLimitMiB: 1024,
        desiredCount: 2,
        cpu: 512,
        taskDefinition: fargateTaskDefinition,
        publicLoadBalancer: false
      }

    // Create Fargate Service
    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'url-shortener-fargate-service', fargateServiceProps);

    // Setup AutoScaling policy
    const scaling = fargateService.service.autoScaleTaskCount({
        minCapacity: 2,
        maxCapacity: 4
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60)
    });
      
    const api = new apigw.CfnApi(this, "HttpApiGateway", {
      name: "UrlShortenerApi",
      protocolType: "HTTP"
    });

    const httpVpcLink = new cdk.CfnResource(this, "HttpVpcLink", {
        type: "AWS::ApiGatewayV2::VpcLink",
        properties: {
          Name: "V2 VPC Link",
          SubnetIds: vpc.privateSubnets.map(m => m.subnetId)
        }
      });

    const integration = new apigw.CfnIntegration(this, "HttpApiGatewayIntegration", {
      apiId: api.ref,
      connectionId: httpVpcLink.ref,
      connectionType: "VPC_LINK",
      description: "API Integration",
      integrationMethod: "GET",
      integrationType: "HTTP_PROXY",
      integrationUri: fargateService.listener.listenerArn,
      payloadFormatVersion: "1.0",
    });

    new apigw.CfnRoute(this, 'Route', {
      apiId: api.ref,
      routeKey: 'GET /{proxy}',
      target: `integrations/${integration.ref}`,
    });

    const cfnStage = new apigw.CfnStage(this, 'CfnStage', {
        apiId: api.ref,
        stageName: '$default',
        autoDeploy: true
    });

    new cloudfront.Distribution(this, 'Dist', {
        defaultBehavior: {
          origin: new origins.HttpOrigin(
            api.ref + '.execute-api.' + cdk.Stack.of(this).region + '.amazonaws.com'
          ),
        },
      });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', { value: fargateService.loadBalancer.loadBalancerDnsName });
    new cdk.CfnOutput(this, 'ApiRef', { value: api.ref });
    
  }
}