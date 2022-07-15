import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as Cdk from '../lib/cdk-skeen-gry-test-service';

test('Stack resources created', () => {
  const app = new cdk.App();
  const stack = new Cdk.SkeenGryTestService(app, 'TestSkeenGryTestService');

  const template = Template.fromStack(stack);

  template.resourceCountIs('AWS::CloudFront::Distribution', 1);
  template.resourceCountIs('AWS::ApiGatewayV2::Stage', 1);
  template.resourceCountIs('AWS::ApiGatewayV2::Route', 1);
  template.resourceCountIs('AWS::ApiGatewayV2::Integration', 1);
  template.resourceCountIs('AWS::ApiGatewayV2::VpcLink', 1);
  template.resourceCountIs('AWS::ApiGatewayV2::Api', 1);
  template.resourceCountIs('AWS::ApplicationAutoScaling::ScalingPolicy', 1);
  template.resourceCountIs('AWS::ApplicationAutoScaling::ScalableTarget', 1);
  template.resourceCountIs('AWS::EC2::SecurityGroupIngress', 1);
  template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
  template.resourceCountIs('AWS::ECS::Service', 1);
  template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 1);
  template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 1);
  template.resourceCountIs('AWS::EC2::SecurityGroupEgress', 1);
  template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
  template.resourceCountIs('AWS::IAM::Policy', 2);
  template.resourceCountIs('AWS::IAM::Role', 2);
  template.resourceCountIs('AWS::Logs::LogGroup', 1);
  template.resourceCountIs('AWS::ECS::TaskDefinition', 1);
  template.resourceCountIs('AWS::ECS::Cluster', 1);
  template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
  template.resourceCountIs('AWS::EC2::InternetGateway', 1);
  template.resourceCountIs('AWS::EC2::Route', 4);
  template.resourceCountIs('AWS::EC2::SubnetRouteTableAssociation', 4);
  template.resourceCountIs('AWS::EC2::RouteTable', 4);
  template.resourceCountIs('AWS::EC2::Subnet', 4);
  template.resourceCountIs('AWS::EC2::NatGateway', 2);
  template.resourceCountIs('AWS::EC2::EIP', 2);
  template.resourceCountIs('AWS::EC2::VPC', 1);
  template.resourceCountIs('AWS::DynamoDB::Table', 1);
});

test('ECS service task definition is correct', () => {
  const app = new cdk.App();
  const stack = new Cdk.SkeenGryTestService(app, 'TestSkeenGryTestService');

  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::ECS::TaskDefinition', {
    "ContainerDefinitions": [
      {
        "Essential": true,
        "Image": "chiefus/url-shortener:0.0.1",
        "LogConfiguration": {
          "LogDriver": "awslogs",
          "Options": {
            "awslogs-group": {
              "Ref": "TaskDefWebContainerLogGroupD103C3CB"
            },
            "awslogs-stream-prefix": "url_shortener",
            "awslogs-region": {
              "Ref": "AWS::Region"
            }
          }
        },
        "Name": "WebContainer",
        "PortMappings": [
          {
            "ContainerPort": 8080,
            "HostPort": 8080,
            "Protocol": "tcp"
          }
        ]
      }
    ],
    "Cpu": "512",
    "ExecutionRoleArn": {
      "Fn::GetAtt": [
        "TaskDefExecutionRoleB4775C97",
        "Arn"
      ]
    },
    "Family": "TestSkeenGryTestServiceTaskDef9381CF9F",
    "Memory": "1024",
    "NetworkMode": "awsvpc",
    "RequiresCompatibilities": [
      "FARGATE"
    ],
    "TaskRoleArn": {
      "Fn::GetAtt": [
        "Role1ABCC5F0",
        "Arn"
      ]
    }
  });
});

test('API GW has correct properties', () => {
  const app = new cdk.App();
  const stack = new Cdk.SkeenGryTestService(app, 'TestSkeenGryTestService');

  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::ApiGatewayV2::Integration', {
    "ApiId": {
      "Ref": "HttpApiGateway"
    },
    "IntegrationType": "HTTP_PROXY",
    "ConnectionId": {
      "Ref": "HttpVpcLink"
    },
    "ConnectionType": "VPC_LINK",
    "Description": "API Integration",
    "IntegrationMethod": "GET",
    "IntegrationUri": {
      "Ref": "urlshortenerfargateserviceLBPublicListenerACBE1A9D"
    },
    "PayloadFormatVersion": "1.0"
});
});